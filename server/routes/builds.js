const express = require('express');
const router = express.Router();
const { connect } = require('../db');
const { analyzeText } = require('../services/gemini');

// --- HELPER: The "Math" & Prediction Logic ---
function calculateRiskAndRecommendation(featureHistory) {
    // featureHistory is [bugsInNewestBuild, bugsInOlderBuild...]

    // If we only have 1 build (Demo Data), we calculate risk based solely on that.
    if (!featureHistory || featureHistory.length === 0) {
        return { riskScore: 0, trend: 'neutral', recommendation: 'None' };
    }

    let weightedSum = 0;
    let weightTotal = 0;

    featureHistory.forEach((bugCount, index) => {
        const weight = 5 - index;
        if (weight > 0) {
            weightedSum += (bugCount * weight);
            weightTotal += weight;
        }
    });

    // Normalize: Max bugs reasonable ~10. If we have 10 bugs in Build 1 (weight 5), 
    // weightedSum = 50. weightTotal = 5. Avg = 10. Risk ~ 100%.
    const averageWeightedBugs = weightTotal > 0 ? (weightedSum / weightTotal) : 0;

    // Simple linear scale: 10 bugs avg = 100% risk.
    const riskScoreRaw = averageWeightedBugs * 10;
    const riskScore = Math.min(Math.round(riskScoreRaw), 100);

    // Trend
    const recentBugs = featureHistory[0] || 0;
    const previousBugs = featureHistory[1] || 0; // Will be 0 if only 1 build exists

    let trend = 'neutral';
    if (featureHistory.length > 1) {
        if (recentBugs > previousBugs) trend = 'up';
        else if (recentBugs < previousBugs) trend = 'down';
    } else {
        // For single demo build, if high bugs, assume trend is concerning
        if (recentBugs > 2) trend = 'up';
    }

    // Recommendation logic
    let recommendation = "None";

    // If risk is very high or recent bugs are critical
    if (recentBugs >= 3 || riskScore > 60) {
        recommendation = "Full Retest";
    } else if (recentBugs > 0 || riskScore > 20) {
        recommendation = "Partial Retest";
    }

    return { riskScore, trend, recommendation };
}

// POST /api/builds - Upload & Analyze
router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        const buildsToInsert = payload.builds || (Array.isArray(payload) ? payload : [payload]);

        const db = await connect();
        const col = db.collection('builds');

        const processedBuilds = [];

        for (const b of buildsToInsert) {
            b.createdAt = new Date();
            b.release_cycle = payload.release_cycle_name || "Unknown Cycle";

            // 1. Loop through Modules
            if (b.modules) {
                for (const m of b.modules) {
                    // 2. Loop through Features
                    if (m.features) {
                        for (const f of m.features) {
                            // 3. Loop through Test Cases
                            if (f.test_cases) {
                                for (const tc of f.test_cases) {

                                    // ---------------------------------------------------------
                                    // LOGIC: Only send to AI if Status is 'Failed'
                                    // ---------------------------------------------------------
                                    if (tc.status === 'Failed') {
                                        console.log(`❌ Analyzing failure: ${tc.title}`);

                                        // Create the detailed context object
                                        const context = {
                                            buildId: b.build_id,
                                            moduleName: m.module_name,
                                            featureName: f.feature_name,
                                            testName: tc.title,
                                            script: tc.script_content,
                                            errorLog: tc.bug_info?.error_log
                                        };

                                        // CALL GEMINI (Only for failures)
                                        /* eslint-disable no-await-in-loop */
                                        tc.ai_suggestion = await analyzeText(context);
                                    } else {
                                        // ---------------------------------------------------------
                                        // LOGIC: If Passed, do NOT call AI, but keep data for UI
                                        // ---------------------------------------------------------
                                        console.log(`✅ Skipping AI for passed test: ${tc.title}`);
                                        tc.ai_suggestion = null; // Ensure field exists but is null
                                    }
                                }
                            }
                        }
                    }
                }
            }
            processedBuilds.push(b);
        }

        // Save EVERYTHING to DB (Pass + Fail) so the UI can show charts
        const result = await col.insertMany(processedBuilds);
        res.json({ success: true, count: result.insertedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/builds/risk-analysis - The Prediction Dashboard Endpoint
router.get('/risk-analysis', async (req, res) => {
    try {
        const db = await connect();
        const col = db.collection('builds');

        // 1. Get Recent 5 Builds (Your "Flow" Requirement)
        const recentBuilds = await col.find({})
            .sort({ build_date: -1 }) // Newest first
            .limit(5)
            .toArray();

        if (!recentBuilds || recentBuilds.length === 0) return res.json([]);

        // 2. Aggregate Data by Feature across these builds
        // Structure: { "User Login": { history: [3, 0, 1...], p1: 1, p2: 2... } }
        const featureMap = {};

        recentBuilds.forEach((build) => {
            if (!build.modules) return;
            build.modules.forEach(mod => {
                if (!mod.features) return;
                mod.features.forEach(feat => {
                    // Use feature name as key. 
                    const name = feat.feature_name;
                    if (!featureMap[name]) {
                        featureMap[name] = {
                            history: [],
                            p1: 0, p2: 0, p3: 0, open: 0,
                            lastTested: build.build_date
                        };
                    }

                    // Count bugs in THIS build for THIS feature
                    const bugsInThisBuild = feat.test_cases?.filter(tc => tc.status === 'Failed').length || 0;
                    featureMap[name].history.push(bugsInThisBuild);

                    // Accumulate specific severity counts (We sum them up for the 'overview')
                    if (feat.test_cases) {
                        feat.test_cases.forEach(tc => {
                            if (tc.status === 'Failed' && tc.bug_info) {
                                if (tc.bug_info.severity === 'P1') featureMap[name].p1++;
                                if (tc.bug_info.severity === 'P2') featureMap[name].p2++;
                                if (tc.bug_info.severity === 'P3') featureMap[name].p3++;
                                featureMap[name].open++;
                            }
                        });
                    }
                });
            });
        });

        // 3. Convert Map to Array using your Math Logic
        const riskData = Object.keys(featureMap).map(key => {
            const data = featureMap[key];

            // --- CALL THE HELPER FUNCTION ---
            const math = calculateRiskAndRecommendation(data.history);

            let level = 'low';
            if (math.riskScore > 70) level = 'high';
            else if (math.riskScore > 40) level = 'medium';

            return {
                id: key,
                feature: key,
                riskScore: math.riskScore,
                riskLevel: level,
                trend: math.trend,
                openBugs: data.open,
                p1Bugs: data.p1,
                p2Bugs: data.p2,
                p3Bugs: data.p3,
                lastTested: new Date(data.lastTested).toLocaleDateString(),
                retestRecommendation: math.recommendation
            };
        });

        res.json(riskData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/builds/recent - For Main Dashboard
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '1');
        const db = await connect();
        const docs = await db.collection('builds').find().sort({ build_date: -1 }).limit(limit).toArray();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// EXPORT DIRECTLY (No brackets) to fix the "requires middleware" error
module.exports = router;
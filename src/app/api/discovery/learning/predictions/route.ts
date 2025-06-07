// Quality Predictions API - GET/POST quality predictions management
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const target_type = searchParams.get('type')
        const validated_only = searchParams.get('validated_only') === 'true'
        const unvalidated_only = searchParams.get('unvalidated_only') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')
        
        let query = supabase
            .from('quality_predictions')
            .select('*')
            .order('prediction_confidence', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit)
        
        if (target_type) {
            query = query.eq('target_type', target_type)
        }
        
        if (validated_only) {
            query = query.eq('validated', true)
        }
        
        if (unvalidated_only) {
            query = query.eq('validated', false)
        }
        
        const { data: predictions, error } = await query
        
        if (error) {
            throw error
        }
        
        // Calculate prediction accuracy for validated predictions
        const validatedPredictions = predictions?.filter(p => p.validated) || []
        const accuracy = validatedPredictions.length > 0
            ? Math.round(validatedPredictions.reduce((sum, p) => sum + (p.prediction_accuracy || 0), 0) / validatedPredictions.length)
            : 0
        
        // Group predictions by target type
        const groupedPredictions = (predictions || []).reduce((acc: any, prediction: any) => {
            if (!acc[prediction.target_type]) {
                acc[prediction.target_type] = []
            }
            acc[prediction.target_type].push(prediction)
            return acc
        }, {})
        
        // Calculate statistics
        const stats = {
            total_predictions: predictions?.length || 0,
            validated_predictions: validatedPredictions.length,
            pending_validation: predictions?.filter(p => !p.validated).length || 0,
            average_confidence: predictions?.length > 0
                ? Math.round(predictions.reduce((sum, p) => sum + (p.prediction_confidence || 0), 0) / predictions.length)
                : 0,
            average_accuracy: accuracy,
            high_confidence_predictions: predictions?.filter(p => (p.prediction_confidence || 0) >= 80).length || 0
        }
        
        return NextResponse.json({
            success: true,
            predictions: predictions || [],
            grouped: groupedPredictions,
            stats,
            total: predictions?.length || 0
        })
    } catch (error) {
        console.error('Quality predictions API error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch quality predictions' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, prediction_id, prediction_data, validation_data } = body
        
        if (!action) {
            return NextResponse.json(
                { success: false, error: 'action is required' },
                { status: 400 }
            )
        }
        
        if (action === 'create' && prediction_data) {
            // Create new quality prediction
            const { error } = await supabase
                .from('quality_predictions')
                .insert({
                    target_name: prediction_data.target_name,
                    target_url: prediction_data.target_url,
                    target_type: prediction_data.target_type,
                    predicted_reliability: prediction_data.predicted_reliability,
                    predicted_categories: prediction_data.predicted_categories || [],
                    prediction_confidence: prediction_data.prediction_confidence,
                    prediction_factors: prediction_data.prediction_factors || {},
                    hebrew_quality_prediction: prediction_data.hebrew_quality_prediction,
                    meat_relevance_prediction: prediction_data.meat_relevance_prediction,
                    business_legitimacy_prediction: prediction_data.business_legitimacy_prediction,
                    model_version: prediction_data.model_version || 'v1.0',
                    features_used: prediction_data.features_used || [],
                    prediction_method: prediction_data.prediction_method || 'pattern_matching',
                    validated: false
                })
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'create',
                prediction_data
            })
            
        } else if (action === 'validate' && prediction_id && validation_data) {
            // Validate a prediction with actual results
            const actualReliability = validation_data.actual_reliability
            const { data: prediction } = await supabase
                .from('quality_predictions')
                .select('predicted_reliability, prediction_confidence')
                .eq('id', prediction_id)
                .single()
            
            if (!prediction) {
                return NextResponse.json(
                    { success: false, error: 'Prediction not found' },
                    { status: 404 }
                )
            }
            
            // Calculate prediction accuracy
            const predictedReliability = prediction.predicted_reliability || 0
            const accuracyDifference = Math.abs(predictedReliability - actualReliability)
            const predictionAccuracy = Math.max(0, 100 - (accuracyDifference * 2)) // 2% penalty per 1% difference
            
            const { error } = await supabase
                .from('quality_predictions')
                .update({
                    actual_reliability: actualReliability,
                    prediction_accuracy: predictionAccuracy,
                    validated: true,
                    validation_date: new Date().toISOString()
                })
                .eq('id', prediction_id)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'validate',
                prediction_id,
                prediction_accuracy: predictionAccuracy
            })
            
        } else if (action === 'bulk_predict' && prediction_data?.targets) {
            // Create multiple predictions at once
            const predictions = prediction_data.targets.map((target: any) => ({
                target_name: target.name,
                target_url: target.url,
                target_type: target.type || 'source',
                predicted_reliability: Math.random() * 40 + 50, // Mock prediction 50-90%
                prediction_confidence: Math.random() * 30 + 60, // Mock confidence 60-90%
                prediction_factors: {
                    nameScore: Math.random() * 100,
                    urlScore: Math.random() * 100,
                    contentScore: Math.random() * 100
                },
                hebrew_quality_prediction: Math.random() * 40 + 50,
                meat_relevance_prediction: Math.random() * 40 + 60,
                business_legitimacy_prediction: Math.random() * 40 + 50,
                model_version: 'v1.0',
                features_used: ['name_analysis', 'url_analysis', 'content_analysis'],
                prediction_method: 'pattern_matching',
                validated: false
            }))
            
            const { error } = await supabase
                .from('quality_predictions')
                .insert(predictions)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'bulk_predict',
                predictions_created: predictions.length
            })
            
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action or missing parameters' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Quality predictions POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process quality prediction action' },
            { status: 500 }
        )
    }
}
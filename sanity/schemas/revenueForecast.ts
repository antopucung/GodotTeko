export default {
  name: 'revenueForecast',
  title: 'Revenue Forecast',
  type: 'document',
  fields: [
    {
      name: 'forecastId',
      title: 'Forecast ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Unique forecast identifier'
    },
    {
      name: 'name',
      title: 'Forecast Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Descriptive name for this forecast'
    },
    {
      name: 'forecastType',
      title: 'Forecast Type',
      type: 'string',
      options: {
        list: [
          { title: 'Revenue Projection', value: 'revenue' },
          { title: 'Sales Volume', value: 'sales' },
          { title: 'Partner Earnings', value: 'partner_earnings' },
          { title: 'Market Growth', value: 'market_growth' },
          { title: 'Seasonal Analysis', value: 'seasonal' },
          { title: 'Product Performance', value: 'product' },
          { title: 'Customer Acquisition', value: 'acquisition' },
          { title: 'Churn Prediction', value: 'churn' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'timeframe',
      title: 'Forecast Timeframe',
      type: 'object',
      fields: [
        {
          name: 'startDate',
          title: 'Forecast Start Date',
          type: 'date',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'endDate',
          title: 'Forecast End Date',
          type: 'date',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'granularity',
          title: 'Data Granularity',
          type: 'string',
          options: {
            list: [
              { title: 'Daily', value: 'daily' },
              { title: 'Weekly', value: 'weekly' },
              { title: 'Monthly', value: 'monthly' },
              { title: 'Quarterly', value: 'quarterly' },
              { title: 'Yearly', value: 'yearly' }
            ]
          },
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'horizon',
          title: 'Forecast Horizon (months)',
          type: 'number',
          validation: (Rule: any) => Rule.required().min(1).max(36)
        }
      ]
    },
    {
      name: 'methodology',
      title: 'Forecasting Methodology',
      type: 'object',
      fields: [
        {
          name: 'algorithm',
          title: 'Algorithm Used',
          type: 'string',
          options: {
            list: [
              { title: 'Linear Regression', value: 'linear' },
              { title: 'Exponential Smoothing', value: 'exponential' },
              { title: 'ARIMA', value: 'arima' },
              { title: 'Seasonal Decomposition', value: 'seasonal' },
              { title: 'Machine Learning', value: 'ml' },
              { title: 'Hybrid Model', value: 'hybrid' },
              { title: 'Manual Estimation', value: 'manual' }
            ]
          }
        },
        {
          name: 'factors',
          title: 'Influencing Factors',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'factor',
                  title: 'Factor Name',
                  type: 'string'
                },
                {
                  name: 'weight',
                  title: 'Weight/Importance',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(1)
                },
                {
                  name: 'impact',
                  title: 'Expected Impact',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Positive', value: 'positive' },
                      { title: 'Negative', value: 'negative' },
                      { title: 'Neutral', value: 'neutral' }
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          name: 'confidence',
          title: 'Confidence Level (%)',
          type: 'number',
          validation: (Rule: any) => Rule.min(0).max(100)
        }
      ]
    },
    {
      name: 'historicalData',
      title: 'Historical Data Used',
      type: 'object',
      fields: [
        {
          name: 'dataPoints',
          title: 'Number of Data Points',
          type: 'number'
        },
        {
          name: 'lookbackPeriod',
          title: 'Lookback Period (months)',
          type: 'number'
        },
        {
          name: 'dataQuality',
          title: 'Data Quality Score',
          type: 'number',
          validation: (Rule: any) => Rule.min(0).max(100)
        },
        {
          name: 'anomaliesDetected',
          title: 'Anomalies Detected',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'seasonalPatterns',
          title: 'Seasonal Patterns Identified',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'pattern',
                  title: 'Pattern Name',
                  type: 'string'
                },
                {
                  name: 'strength',
                  title: 'Pattern Strength',
                  type: 'number',
                  validation: (Rule: any) => Rule.min(0).max(1)
                },
                {
                  name: 'period',
                  title: 'Period (e.g., monthly, quarterly)',
                  type: 'string'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'predictions',
      title: 'Forecast Predictions',
      type: 'object',
      fields: [
        {
          name: 'totalProjectedRevenue',
          title: 'Total Projected Revenue',
          type: 'number',
          validation: (Rule: any) => Rule.min(0)
        },
        {
          name: 'projectedGrowthRate',
          title: 'Projected Growth Rate (%)',
          type: 'number'
        },
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          initialValue: 'USD'
        },
        {
          name: 'dataPoints',
          title: 'Forecast Data Points',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'date',
                  title: 'Date',
                  type: 'date'
                },
                {
                  name: 'predictedValue',
                  title: 'Predicted Value',
                  type: 'number'
                },
                {
                  name: 'confidenceInterval',
                  title: 'Confidence Interval',
                  type: 'object',
                  fields: [
                    {
                      name: 'lower',
                      title: 'Lower Bound',
                      type: 'number'
                    },
                    {
                      name: 'upper',
                      title: 'Upper Bound',
                      type: 'number'
                    }
                  ]
                },
                {
                  name: 'factors',
                  title: 'Contributing Factors',
                  type: 'object',
                  fields: [
                    {
                      name: 'baselineGrowth',
                      title: 'Baseline Growth',
                      type: 'number'
                    },
                    {
                      name: 'seasonalAdjustment',
                      title: 'Seasonal Adjustment',
                      type: 'number'
                    },
                    {
                      name: 'marketFactors',
                      title: 'Market Factors',
                      type: 'number'
                    },
                    {
                      name: 'competitiveFactors',
                      title: 'Competitive Factors',
                      type: 'number'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'scenarios',
      title: 'Forecast Scenarios',
      type: 'object',
      fields: [
        {
          name: 'optimistic',
          title: 'Optimistic Scenario',
          type: 'object',
          fields: [
            {
              name: 'projectedRevenue',
              title: 'Projected Revenue',
              type: 'number'
            },
            {
              name: 'growthRate',
              title: 'Growth Rate (%)',
              type: 'number'
            },
            {
              name: 'probability',
              title: 'Probability (%)',
              type: 'number'
            },
            {
              name: 'assumptions',
              title: 'Key Assumptions',
              type: 'array',
              of: [{ type: 'string' }]
            }
          ]
        },
        {
          name: 'realistic',
          title: 'Realistic Scenario',
          type: 'object',
          fields: [
            {
              name: 'projectedRevenue',
              title: 'Projected Revenue',
              type: 'number'
            },
            {
              name: 'growthRate',
              title: 'Growth Rate (%)',
              type: 'number'
            },
            {
              name: 'probability',
              title: 'Probability (%)',
              type: 'number'
            },
            {
              name: 'assumptions',
              title: 'Key Assumptions',
              type: 'array',
              of: [{ type: 'string' }]
            }
          ]
        },
        {
          name: 'pessimistic',
          title: 'Pessimistic Scenario',
          type: 'object',
          fields: [
            {
              name: 'projectedRevenue',
              title: 'Projected Revenue',
              type: 'number'
            },
            {
              name: 'growthRate',
              title: 'Growth Rate (%)',
              type: 'number'
            },
            {
              name: 'probability',
              title: 'Probability (%)',
              type: 'number'
            },
            {
              name: 'assumptions',
              title: 'Key Assumptions',
              type: 'array',
              of: [{ type: 'string' }]
            }
          ]
        }
      ]
    },
    {
      name: 'accuracy',
      title: 'Forecast Accuracy',
      type: 'object',
      fields: [
        {
          name: 'backtestResults',
          title: 'Backtest Results',
          type: 'object',
          fields: [
            {
              name: 'mape',
              title: 'Mean Absolute Percentage Error (%)',
              type: 'number'
            },
            {
              name: 'rmse',
              title: 'Root Mean Square Error',
              type: 'number'
            },
            {
              name: 'r2Score',
              title: 'R² Score',
              type: 'number'
            },
            {
              name: 'testPeriod',
              title: 'Test Period',
              type: 'string'
            }
          ]
        },
        {
          name: 'actualVsPredicted',
          title: 'Actual vs Predicted Comparison',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'date',
                  title: 'Date',
                  type: 'date'
                },
                {
                  name: 'actualValue',
                  title: 'Actual Value',
                  type: 'number'
                },
                {
                  name: 'predictedValue',
                  title: 'Predicted Value',
                  type: 'number'
                },
                {
                  name: 'error',
                  title: 'Error (%)',
                  type: 'number'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'recommendations',
      title: 'Strategic Recommendations',
      type: 'object',
      fields: [
        {
          name: 'actionItems',
          title: 'Recommended Actions',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'action',
                  title: 'Action',
                  type: 'string'
                },
                {
                  name: 'priority',
                  title: 'Priority',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'High', value: 'high' },
                      { title: 'Medium', value: 'medium' },
                      { title: 'Low', value: 'low' }
                    ]
                  }
                },
                {
                  name: 'expectedImpact',
                  title: 'Expected Impact',
                  type: 'string'
                },
                {
                  name: 'timeline',
                  title: 'Timeline',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'riskFactors',
          title: 'Risk Factors',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'risk',
                  title: 'Risk Description',
                  type: 'string'
                },
                {
                  name: 'probability',
                  title: 'Probability (%)',
                  type: 'number'
                },
                {
                  name: 'impact',
                  title: 'Potential Impact',
                  type: 'string'
                },
                {
                  name: 'mitigation',
                  title: 'Mitigation Strategy',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'opportunities',
          title: 'Growth Opportunities',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'opportunity',
                  title: 'Opportunity Description',
                  type: 'string'
                },
                {
                  name: 'potentialRevenue',
                  title: 'Potential Revenue Impact',
                  type: 'number'
                },
                {
                  name: 'timeToRealize',
                  title: 'Time to Realize (months)',
                  type: 'number'
                },
                {
                  name: 'investmentRequired',
                  title: 'Investment Required',
                  type: 'number'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'status',
      title: 'Forecast Status',
      type: 'string',
      options: {
        list: [
          { title: 'In Progress', value: 'in_progress' },
          { title: 'Complete', value: 'complete' },
          { title: 'Under Review', value: 'review' },
          { title: 'Approved', value: 'approved' },
          { title: 'Archived', value: 'archived' }
        ]
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'in_progress'
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'createdAt',
          title: 'Created At',
          type: 'datetime',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'createdBy',
          title: 'Created By',
          type: 'reference',
          to: [{ type: 'user' }]
        },
        {
          name: 'lastUpdatedAt',
          title: 'Last Updated At',
          type: 'datetime'
        },
        {
          name: 'nextUpdateDue',
          title: 'Next Update Due',
          type: 'date'
        },
        {
          name: 'modelVersion',
          title: 'Model Version',
          type: 'string'
        },
        {
          name: 'tags',
          title: 'Tags',
          type: 'array',
          of: [{ type: 'string' }]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'forecastType',
      status: 'status',
      totalRevenue: 'predictions.totalProjectedRevenue',
      growthRate: 'predictions.projectedGrowthRate',
      horizon: 'timeframe.horizon'
    },
    prepare(selection: any) {
      const { title, subtitle, status, totalRevenue, growthRate, horizon } = selection
      const statusIcon = {
        in_progress: '⏳',
        complete: '✅',
        review: '👀',
        approved: '✅',
        archived: '📦'
      }[status] || '📊'

      const typeLabel = {
        revenue: 'Revenue',
        sales: 'Sales',
        partner_earnings: 'Partner',
        market_growth: 'Market',
        seasonal: 'Seasonal',
        product: 'Product',
        acquisition: 'Acquisition',
        churn: 'Churn'
      }[subtitle] || subtitle

      return {
        title: title || `${typeLabel} Forecast`,
        subtitle: `${statusIcon} ${status} • ${horizon}mo • ${growthRate?.toFixed(1) || 0}% growth • $${totalRevenue?.toLocaleString() || 0}`,
        media: '📈'
      }
    }
  },
  orderings: [
    {
      title: 'Created Date (Newest)',
      name: 'createdDesc',
      by: [{ field: 'metadata.createdAt', direction: 'desc' }]
    },
    {
      title: 'Projected Revenue (Highest)',
      name: 'revenueDesc',
      by: [{ field: 'predictions.totalProjectedRevenue', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Forecast Type',
      name: 'typeAsc',
      by: [{ field: 'forecastType', direction: 'asc' }]
    }
  ]
}

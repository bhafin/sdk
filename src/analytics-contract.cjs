"use strict";
// Generated from the reviewed analytics OpenAPI snapshot. Transport only.
module.exports = {
  "operations": {
    "analytics_scheme": {
      "path": "/v1/accounts/{account}/market-data/schemes/{id}/performance",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [
        {
          "name": "account",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^(me|acct_[a-f0-9]{32})$"
          }
        },
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        },
        {
          "name": "as_of",
          "in": "query",
          "required": true,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-01$"
          }
        },
        {
          "name": "periods",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^(1y|3y|5y|since_inception)(,(1y|3y|5y|since_inception)){0,3}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "properties": {
          "methodology_version": {
            "const": "ts-analytics-v1"
          },
          "requested_as_of": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-01$"
          },
          "currency": {
            "const": "INR"
          },
          "source_cutoff": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          },
          "source_version": {
            "type": "string"
          },
          "warnings": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "object": {
            "const": "scheme_performance"
          },
          "scheme_id": {
            "type": "string"
          },
          "fund_id": {
            "type": "string"
          },
          "plan": {
            "type": "string"
          },
          "option": {
            "type": "string"
          },
          "basis": {
            "type": "string"
          },
          "periods": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "period": {
                  "enum": [
                    "1y",
                    "3y",
                    "5y",
                    "since_inception"
                  ]
                },
                "requested_start": {
                  "anyOf": [
                    {
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "requested_end": {
                  "type": "string",
                  "format": "date",
                  "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                },
                "status": {
                  "enum": [
                    "available",
                    "unavailable"
                  ]
                },
                "reason": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "total_return_pct": {
                  "anyOf": [
                    {
                      "type": "object",
                      "properties": {
                        "status": {
                          "const": "available"
                        },
                        "value": {
                          "type": "string",
                          "pattern": "^-?\\d+(\\.\\d{1,8})?$"
                        },
                        "reason": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "status",
                        "value",
                        "reason"
                      ],
                      "additionalProperties": true
                    },
                    {
                      "type": "object",
                      "properties": {
                        "status": {
                          "const": "unavailable"
                        },
                        "value": {
                          "type": "null"
                        },
                        "reason": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "status",
                        "value",
                        "reason"
                      ],
                      "additionalProperties": true
                    }
                  ]
                },
                "cagr_pct": {
                  "anyOf": [
                    {
                      "type": "object",
                      "properties": {
                        "status": {
                          "const": "available"
                        },
                        "value": {
                          "type": "string",
                          "pattern": "^-?\\d+(\\.\\d{1,8})?$"
                        },
                        "reason": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "status",
                        "value",
                        "reason"
                      ],
                      "additionalProperties": true
                    },
                    {
                      "type": "object",
                      "properties": {
                        "status": {
                          "const": "unavailable"
                        },
                        "value": {
                          "type": "null"
                        },
                        "reason": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "status",
                        "value",
                        "reason"
                      ],
                      "additionalProperties": true
                    }
                  ]
                },
                "start_observation_date": {
                  "anyOf": [
                    {
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "end_observation_date": {
                  "anyOf": [
                    {
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "start_nav": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "end_nav": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "start_lag_days": {
                  "anyOf": [
                    {
                      "type": "integer",
                      "minimum": 0
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "end_lag_days": {
                  "anyOf": [
                    {
                      "type": "integer",
                      "minimum": 0
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "elapsed_days": {
                  "anyOf": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "annualization_basis": {
                  "const": "observed_nav_dates_365_25"
                }
              },
              "required": [
                "period",
                "requested_start",
                "requested_end",
                "status",
                "reason",
                "total_return_pct",
                "cagr_pct",
                "start_observation_date",
                "end_observation_date",
                "start_nav",
                "end_nav",
                "start_lag_days",
                "end_lag_days",
                "elapsed_days",
                "annualization_basis"
              ],
              "additionalProperties": true
            },
            "minItems": 1,
            "maxItems": 4
          }
        },
        "required": [
          "methodology_version",
          "requested_as_of",
          "currency",
          "source_cutoff",
          "source_version",
          "warnings",
          "object",
          "scheme_id",
          "fund_id",
          "plan",
          "option",
          "basis",
          "periods"
        ],
        "additionalProperties": true
      }
    },
    "analytics_category": {
      "path": "/v1/accounts/{account}/market-data/categories/{id}/statistics",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [
        {
          "name": "account",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^(me|acct_[a-f0-9]{32})$"
          }
        },
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        },
        {
          "name": "as_of",
          "in": "query",
          "required": true,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-01$"
          }
        },
        {
          "name": "periods",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^(1y|3y|5y|since_inception)(,(1y|3y|5y|since_inception)){0,3}$"
          }
        },
        {
          "name": "metrics",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "const": "return",
            "default": "return"
          }
        },
        {
          "name": "plan",
          "in": "query",
          "required": false,
          "schema": {
            "enum": [
              "direct",
              "regular"
            ]
          }
        },
        {
          "name": "option",
          "in": "query",
          "required": false,
          "schema": {
            "const": "growth"
          }
        }
      ],
      "response": {
        "type": "object",
        "properties": {
          "methodology_version": {
            "const": "ts-analytics-v1"
          },
          "requested_as_of": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-01$"
          },
          "currency": {
            "const": "INR"
          },
          "source_cutoff": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          },
          "source_version": {
            "type": "string"
          },
          "warnings": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "object": {
            "const": "category_statistics"
          },
          "category": {
            "type": "string"
          },
          "cohort": {
            "type": "object",
            "properties": {
              "policy": {
                "const": "current_classification_as_of_prices"
              },
              "plan": {
                "enum": [
                  "direct",
                  "regular"
                ]
              },
              "option": {
                "const": "growth"
              },
              "fund_count": {
                "type": "integer",
                "minimum": 0
              },
              "selected_scheme_count": {
                "type": "integer",
                "minimum": 0
              },
              "classification_date": {
                "anyOf": [
                  {
                    "type": "string",
                    "format": "date",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            },
            "required": [
              "policy",
              "plan",
              "option",
              "fund_count",
              "selected_scheme_count",
              "classification_date"
            ],
            "additionalProperties": true
          },
          "metrics": {
            "type": "object",
            "additionalProperties": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "status": {
                      "const": "available"
                    },
                    "value": {
                      "type": "string",
                      "pattern": "^-?\\d+(\\.\\d{1,8})?$"
                    },
                    "reason": {
                      "type": "null"
                    },
                    "method": {
                      "const": "equal_weighted_arithmetic_mean"
                    },
                    "unit": {
                      "type": "string"
                    },
                    "eligible_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "valid_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "stale_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "invalid_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "missing_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "coverage_pct": {
                      "type": "string",
                      "pattern": "^\\d+(\\.\\d+)?$"
                    },
                    "exclusions": {
                      "type": "object",
                      "additionalProperties": {
                        "type": "integer",
                        "minimum": 0
                      }
                    }
                  },
                  "required": [
                    "status",
                    "value",
                    "reason",
                    "method",
                    "unit",
                    "eligible_count",
                    "valid_count",
                    "stale_count",
                    "invalid_count",
                    "missing_count",
                    "coverage_pct",
                    "exclusions"
                  ],
                  "additionalProperties": true
                },
                {
                  "type": "object",
                  "properties": {
                    "status": {
                      "const": "unavailable"
                    },
                    "value": {
                      "type": "null"
                    },
                    "reason": {
                      "type": "string"
                    },
                    "method": {
                      "const": "equal_weighted_arithmetic_mean"
                    },
                    "unit": {
                      "type": "string"
                    },
                    "eligible_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "valid_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "stale_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "invalid_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "missing_count": {
                      "type": "integer",
                      "minimum": 0
                    },
                    "coverage_pct": {
                      "type": "string",
                      "pattern": "^\\d+(\\.\\d+)?$"
                    },
                    "exclusions": {
                      "type": "object",
                      "additionalProperties": {
                        "type": "integer",
                        "minimum": 0
                      }
                    }
                  },
                  "required": [
                    "status",
                    "value",
                    "reason",
                    "method",
                    "unit",
                    "eligible_count",
                    "valid_count",
                    "stale_count",
                    "invalid_count",
                    "missing_count",
                    "coverage_pct",
                    "exclusions"
                  ],
                  "additionalProperties": true
                }
              ]
            }
          }
        },
        "required": [
          "methodology_version",
          "requested_as_of",
          "currency",
          "source_cutoff",
          "source_version",
          "warnings",
          "object",
          "category",
          "cohort",
          "metrics"
        ],
        "additionalProperties": true
      }
    }
  }
};

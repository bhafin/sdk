"use strict";
// Generated from the reviewed monthly OpenAPI snapshot. Transport only.
module.exports = {
  "operations": {
    "monthly_nav": {
      "path": "/v1/accounts/{account}/market-data/schemes/{id}/navs",
      "method": "GET",
      "status": 200,
      "marketData": true,
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
            "pattern": "^[0-9]{4}-[0-9]{2}-01$"
          }
        }
      ],
      "response": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "string",
                "format": "date"
              },
              "status": {
                "const": "available"
              },
              "data": {
                "type": "object",
                "required": [
                  "id",
                  "scheme_id",
                  "date",
                  "amount",
                  "currency"
                ],
                "properties": {
                  "id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  },
                  "scheme_id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  },
                  "date": {
                    "type": "string",
                    "format": "date"
                  },
                  "amount": {
                    "type": "string"
                  },
                  "currency": {
                    "type": "string"
                  }
                },
                "additionalProperties": true
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "null"
              },
              "status": {
                "const": "missing"
              },
              "data": {
                "type": "null"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    },
    "monthly_expense": {
      "path": "/v1/accounts/{account}/market-data/schemes/{id}/expense-ratios",
      "method": "GET",
      "status": 200,
      "marketData": true,
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
            "pattern": "^[0-9]{4}-[0-9]{2}-01$"
          }
        }
      ],
      "response": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "string",
                "format": "date"
              },
              "status": {
                "const": "available"
              },
              "data": {
                "type": "object",
                "required": [
                  "id",
                  "scheme_id",
                  "date",
                  "value"
                ],
                "properties": {
                  "id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  },
                  "scheme_id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  },
                  "date": {
                    "type": "string",
                    "format": "date"
                  },
                  "value": {
                    "anyOf": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                },
                "additionalProperties": true
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "null"
              },
              "status": {
                "const": "missing"
              },
              "data": {
                "type": "null"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    },
    "monthly_portfolio": {
      "path": "/v1/accounts/{account}/market-data/funds/{id}/portfolios",
      "method": "GET",
      "status": 200,
      "marketData": true,
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
            "pattern": "^[0-9]{4}-[0-9]{2}-01$"
          }
        }
      ],
      "response": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "string",
                "format": "date"
              },
              "status": {
                "const": "available"
              },
              "data": {
                "type": "object",
                "required": [
                  "id",
                  "fund_id",
                  "date"
                ],
                "properties": {
                  "id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  },
                  "fund_id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  },
                  "date": {
                    "type": "string",
                    "format": "date"
                  }
                },
                "additionalProperties": true
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "null"
              },
              "status": {
                "const": "missing"
              },
              "data": {
                "type": "null"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    },
    "monthly_holdings": {
      "path": "/v1/accounts/{account}/market-data/funds/{id}/holdings",
      "method": "GET",
      "status": 200,
      "marketData": true,
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
          "name": "limit",
          "in": "query",
          "required": false,
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          }
        },
        {
          "name": "starting_after",
          "in": "query",
          "required": false,
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
            "pattern": "^[0-9]{4}-[0-9]{2}-01$"
          }
        }
      ],
      "response": {
        "oneOf": [
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "string",
                "format": "date"
              },
              "status": {
                "const": "available"
              },
              "data": {
                "type": "object",
                "required": [
                  "portfolio",
                  "holdings"
                ],
                "additionalProperties": false,
                "properties": {
                  "portfolio": {
                    "type": "object",
                    "required": [
                      "id",
                      "fund_id",
                      "date"
                    ],
                    "properties": {
                      "id": {
                        "type": "string",
                        "pattern": "^[1-9][0-9]{0,18}$"
                      },
                      "fund_id": {
                        "type": "string",
                        "pattern": "^[1-9][0-9]{0,18}$"
                      },
                      "date": {
                        "type": "string",
                        "format": "date"
                      }
                    },
                    "additionalProperties": true
                  },
                  "holdings": {
                    "type": "object",
                    "required": [
                      "object",
                      "data",
                      "has_more",
                      "next_cursor",
                      "source"
                    ],
                    "properties": {
                      "object": {
                        "const": "list"
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "required": [
                            "id",
                            "portfolio_id",
                            "date",
                            "asset_type",
                            "asset_id",
                            "units",
                            "value"
                          ],
                          "properties": {
                            "id": {
                              "type": "string",
                              "pattern": "^[1-9][0-9]{0,18}$"
                            },
                            "portfolio_id": {
                              "type": "string",
                              "pattern": "^[1-9][0-9]{0,18}$"
                            },
                            "date": {
                              "type": "string",
                              "format": "date"
                            },
                            "asset_type": {
                              "type": "string"
                            },
                            "asset_id": {
                              "type": "string",
                              "pattern": "^[1-9][0-9]{0,18}$"
                            },
                            "units": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "value": {
                              "type": "object",
                              "required": [
                                "amount",
                                "currency"
                              ],
                              "properties": {
                                "amount": {
                                  "type": "string"
                                },
                                "currency": {
                                  "type": "string"
                                }
                              },
                              "additionalProperties": true
                            }
                          },
                          "additionalProperties": true
                        },
                        "maxItems": 100
                      },
                      "has_more": {
                        "type": "boolean"
                      },
                      "next_cursor": {
                        "anyOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "source": {
                        "const": "normalized_market_database"
                      }
                    },
                    "additionalProperties": true
                  }
                }
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "required": [
              "object",
              "requested_date",
              "observation_date",
              "status",
              "data"
            ],
            "properties": {
              "object": {
                "const": "market_snapshot"
              },
              "requested_date": {
                "type": "string",
                "format": "date"
              },
              "observation_date": {
                "type": "null"
              },
              "status": {
                "const": "missing"
              },
              "data": {
                "type": "null"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    },
    "monthly_valuation": {
      "path": "/v1/accounts/{account}/market-data/valuations",
      "method": "POST",
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
        }
      ],
      "request": {
        "type": "object",
        "required": [
          "scheme_id"
        ],
        "properties": {
          "scheme_id": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          },
          "units": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?$"
              },
              {
                "type": "null"
              }
            ]
          },
          "as_of": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          },
          "position_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          },
          "observed_value": {
            "type": "string",
            "pattern": "^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?$"
          }
        },
        "additionalProperties": false
      },
      "response": {
        "anyOf": [
          {
            "type": "object",
            "required": [
              "status",
              "scheme_id",
              "units",
              "as_of",
              "value",
              "nav",
              "freshness",
              "ownership_status",
              "position_date",
              "valuation_basis"
            ],
            "properties": {
              "status": {
                "const": "available"
              },
              "scheme_id": {
                "type": "string",
                "pattern": "^[1-9][0-9]{0,18}$"
              },
              "units": {
                "type": "string",
                "pattern": "^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?$"
              },
              "as_of": {
                "type": "string",
                "format": "date",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                "description": "NAV cutoff date. Defaults to today in Asia/Kolkata; separate from investor position date and actual NAV date."
              },
              "value": {
                "type": "object",
                "required": [
                  "amount",
                  "currency"
                ],
                "properties": {
                  "amount": {
                    "type": "string",
                    "pattern": "^[0-9]+(\\.[0-9]+)?$"
                  },
                  "currency": {
                    "const": "INR"
                  }
                },
                "additionalProperties": true
              },
              "nav": {
                "type": "object",
                "required": [
                  "amount",
                  "currency",
                  "date"
                ],
                "properties": {
                  "amount": {
                    "type": "string",
                    "pattern": "^[0-9]+(\\.[0-9]+)?$"
                  },
                  "currency": {
                    "const": "INR"
                  },
                  "date": {
                    "type": "string",
                    "format": "date",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                    "description": "Actual NAV observation date, on or before as_of; never relabelled as the requested cutoff."
                  }
                },
                "additionalProperties": true
              },
              "freshness": {
                "type": "object",
                "required": [
                  "status",
                  "age_days",
                  "recent_within_days",
                  "time_zone"
                ],
                "properties": {
                  "status": {
                    "enum": [
                      "recent",
                      "stale"
                    ]
                  },
                  "age_days": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "recent_within_days": {
                    "const": 3,
                    "description": "Calendar-day freshness threshold, inclusive."
                  },
                  "time_zone": {
                    "const": "Asia/Kolkata",
                    "description": "Financial-date timezone used for the default cutoff."
                  }
                },
                "additionalProperties": true,
                "description": "Age is measured against the requested NAV cutoff, not the position date. recent means age_days <= 3; stale means greater than 3."
              },
              "position_date": {
                "anyOf": [
                  {
                    "type": "string",
                    "format": "date",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                  },
                  {
                    "type": "null"
                  }
                ],
                "description": "Supplied investor-position observation date, or null when omitted. It does not establish current ownership and must not exceed as_of."
              },
              "ownership_status": {
                "const": "user_supplied_not_verified",
                "description": "Supplied quantities and dates are not independent verification of current ownership."
              },
              "valuation_basis": {
                "const": "units_times_latest_nav",
                "description": "Exact decimal units multiplied by latest positive INR NAV on or before as_of."
              }
            },
            "additionalProperties": true
          },
          {
            "type": "object",
            "required": [
              "status",
              "reason",
              "scheme_id",
              "as_of",
              "observed_value",
              "position_date",
              "ownership_status"
            ],
            "properties": {
              "status": {
                "const": "unavailable"
              },
              "reason": {
                "const": "quantity_missing"
              },
              "scheme_id": {
                "type": "string",
                "pattern": "^[1-9][0-9]{0,18}$"
              },
              "as_of": {
                "type": "string",
                "format": "date",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                "description": "NAV cutoff date. Defaults to today in Asia/Kolkata; separate from investor position date and actual NAV date."
              },
              "observed_value": {
                "anyOf": [
                  {
                    "type": "object",
                    "required": [
                      "amount",
                      "currency"
                    ],
                    "properties": {
                      "amount": {
                        "type": "string",
                        "pattern": "^[0-9]+(\\.[0-9]+)?$"
                      },
                      "currency": {
                        "const": "INR"
                      }
                    },
                    "additionalProperties": true
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "position_date": {
                "anyOf": [
                  {
                    "type": "string",
                    "format": "date",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                  },
                  {
                    "type": "null"
                  }
                ],
                "description": "Supplied investor-position observation date, or null when omitted. It does not establish current ownership and must not exceed as_of."
              },
              "ownership_status": {
                "const": "user_supplied_not_verified",
                "description": "Supplied quantities and dates are not independent verification of current ownership."
              }
            },
            "additionalProperties": false,
            "description": "Unavailable valuation retains a nullable observed INR amount and does not contain a computed value."
          },
          {
            "type": "object",
            "required": [
              "status",
              "reason",
              "scheme_id",
              "as_of",
              "observed_value",
              "position_date",
              "ownership_status",
              "units"
            ],
            "properties": {
              "status": {
                "const": "unavailable"
              },
              "reason": {
                "const": "nav_missing"
              },
              "scheme_id": {
                "type": "string",
                "pattern": "^[1-9][0-9]{0,18}$"
              },
              "as_of": {
                "type": "string",
                "format": "date",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                "description": "NAV cutoff date. Defaults to today in Asia/Kolkata; separate from investor position date and actual NAV date."
              },
              "observed_value": {
                "anyOf": [
                  {
                    "type": "object",
                    "required": [
                      "amount",
                      "currency"
                    ],
                    "properties": {
                      "amount": {
                        "type": "string",
                        "pattern": "^[0-9]+(\\.[0-9]+)?$"
                      },
                      "currency": {
                        "const": "INR"
                      }
                    },
                    "additionalProperties": true
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "position_date": {
                "anyOf": [
                  {
                    "type": "string",
                    "format": "date",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                  },
                  {
                    "type": "null"
                  }
                ],
                "description": "Supplied investor-position observation date, or null when omitted. It does not establish current ownership and must not exceed as_of."
              },
              "ownership_status": {
                "const": "user_supplied_not_verified",
                "description": "Supplied quantities and dates are not independent verification of current ownership."
              },
              "units": {
                "type": "string",
                "pattern": "^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?$",
                "description": "Canonical supplied units, present for nav_missing and absent for quantity_missing."
              }
            },
            "additionalProperties": false,
            "description": "Unavailable valuation retains a nullable observed INR amount and does not contain a computed value."
          }
        ]
      }
    }
  }
};

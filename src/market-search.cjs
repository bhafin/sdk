"use strict";
// Generated from the canonical market search contract; all references resolved locally.
module.exports = {
  "operations": {
    "searchMarketSchemes": {
      "path": "/v1/market-data/schemes/search",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [
        {
          "name": "query",
          "in": "query",
          "required": true,
          "description": "2–100 characters. Case-insensitive label and identifier search; percent and underscore are literal.",
          "schema": {
            "type": "string",
            "minLength": 2,
            "maxLength": 100
          }
        },
        {
          "name": "limit",
          "in": "query",
          "required": false,
          "description": "1–20; default 10. Search is a bounded result set, not cursor pagination.",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 20,
            "default": 10
          }
        }
      ],
      "response": {
        "type": "object",
        "properties": {
          "object": {
            "const": "list"
          },
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "instrument": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "pattern": "^ins_[A-Za-z0-9_-]{1,150}$"
                    },
                    "object": {
                      "const": "instrument"
                    },
                    "created": {
                      "type": "integer",
                      "minimum": 0,
                      "maximum": 9007199254740991
                    },
                    "name": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 200,
                      "pattern": "\\S"
                    },
                    "identifiers": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "namespace": {
                            "type": "string"
                          },
                          "value": {
                            "type": "string"
                          }
                        },
                        "required": [
                          "namespace",
                          "value"
                        ],
                        "additionalProperties": true
                      }
                    },
                    "domicile_country": {
                      "anyOf": [
                        {
                          "type": "string"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "type": {
                      "const": "mutual_fund"
                    },
                    "mutual_fund": {
                      "type": "object",
                      "properties": {
                        "fund_name": {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 200,
                          "pattern": "\\S"
                        },
                        "share_class": {
                          "anyOf": [
                            {
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "class_currency": {
                          "anyOf": [
                            {
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "distribution_policy": {
                          "type": "string",
                          "x-known-values": [
                            "accumulating",
                            "distributing",
                            "unknown"
                          ],
                          "minLength": 1
                        }
                      },
                      "required": [
                        "fund_name",
                        "share_class",
                        "class_currency",
                        "distribution_policy"
                      ],
                      "additionalProperties": true
                    }
                  },
                  "required": [
                    "id",
                    "object",
                    "created",
                    "name",
                    "identifiers",
                    "domicile_country",
                    "type",
                    "mutual_fund"
                  ],
                  "additionalProperties": true
                },
                "market": {
                  "const": "IN"
                },
                "currency": {
                  "const": "INR"
                },
                "scheme_id": {
                  "type": "string",
                  "minLength": 1,
                  "description": "Opaque catalogue identifier; production bridge accepts validated positive decimal scheme IDs, fixture IDs are not DB IDs."
                },
                "plan_label": {
                  "type": "string"
                },
                "option_label": {
                  "type": "string"
                },
                "amfi_code": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "isin": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "identity_status": {
                  "type": "string",
                  "x-known-values": [
                    "resolved",
                    "conflict"
                  ],
                  "minLength": 1
                },
                "latest_nav": {
                  "anyOf": [
                    {
                      "type": "object",
                      "properties": {
                        "amount": {
                          "type": "string",
                          "pattern": "^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?$"
                        },
                        "currency": {
                          "const": "INR"
                        },
                        "date": {
                          "type": "string",
                          "format": "date",
                          "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                          "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
                        }
                      },
                      "required": [
                        "amount",
                        "currency",
                        "date"
                      ],
                      "additionalProperties": true
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "data_mode": {
                  "type": "string",
                  "x-known-values": [
                    "live",
                    "fixture"
                  ],
                  "minLength": 1
                },
                "source": {
                  "type": "string"
                },
                "freshness": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "x-known-values": [
                        "recent",
                        "stale",
                        "missing",
                        "invalid",
                        "fixture"
                      ],
                      "minLength": 1
                    },
                    "checked_at": {
                      "type": "string",
                      "format": "date-time"
                    },
                    "as_of": {
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                      "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
                    },
                    "time_zone": {
                      "const": "Asia/Kolkata"
                    },
                    "age_days": {
                      "anyOf": [
                        {
                          "type": "integer"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "recent_within_days": {
                      "const": 3
                    }
                  },
                  "required": [
                    "status",
                    "checked_at",
                    "as_of",
                    "time_zone",
                    "age_days",
                    "recent_within_days"
                  ],
                  "additionalProperties": true
                },
                "mutual_fund_id": {
                  "anyOf": [
                    {
                      "type": "string",
                      "pattern": "^[1-9][0-9]{0,18}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                }
              },
              "required": [
                "instrument",
                "market",
                "currency",
                "scheme_id",
                "plan_label",
                "option_label",
                "amfi_code",
                "isin",
                "identity_status",
                "latest_nav",
                "data_mode",
                "source",
                "freshness"
              ],
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean"
          },
          "url": {
            "type": "string"
          },
          "market_data": {
            "type": "object",
            "properties": {
              "mode": {
                "type": "string",
                "x-known-values": [
                  "live",
                  "fixture",
                  "unavailable"
                ],
                "minLength": 1
              },
              "notice": {
                "type": "string"
              }
            },
            "required": [
              "mode",
              "notice"
            ],
            "additionalProperties": true
          }
        },
        "required": [
          "object",
          "data",
          "has_more",
          "url",
          "market_data"
        ],
        "additionalProperties": true
      }
    }
  }
};

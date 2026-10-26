"use strict";
// Generated from the reviewed first-party OpenAPI snapshot. Transport only.
module.exports = {
  "operations": {
    "md_funds": {
      "path": "/app-api/market-data/funds",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "query",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        },
        {
          "name": "amc",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        },
        {
          "name": "category",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        },
        {
          "name": "manager",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        }
      ],
      "response": {
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
                "name",
                "amc_id",
                "category",
                "active",
                "manager_ids"
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "name": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "amc_id": {
                  "anyOf": [
                    {
                      "type": "string",
                      "pattern": "^[1-9][0-9]{0,18}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "category": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "active": {
                  "anyOf": [
                    {
                      "type": "boolean"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "manager_ids": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,18}$"
                  }
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
    },
    "md_funds_get": {
      "path": "/app-api/market-data/funds/{id}",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "id",
          "name",
          "amc_id",
          "category",
          "active",
          "manager_ids"
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          },
          "name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "amc_id": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[1-9][0-9]{0,18}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "category": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "active": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "null"
              }
            ]
          },
          "manager_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^[1-9][0-9]{0,18}$"
            }
          }
        },
        "additionalProperties": true
      }
    },
    "md_schemes": {
      "path": "/app-api/market-data/schemes",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "query",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        },
        {
          "name": "amc",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        },
        {
          "name": "category",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        },
        {
          "name": "manager",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        },
        {
          "name": "fund",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        }
      ],
      "response": {
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
                "fund_id",
                "fund_name",
                "amfi_code",
                "isin",
                "plan_code",
                "option_code",
                "status_code"
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
                "fund_name": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ]
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
                "plan_code": {
                  "anyOf": [
                    {
                      "type": "integer"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "option_code": {
                  "anyOf": [
                    {
                      "type": "integer"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "status_code": {
                  "anyOf": [
                    {
                      "type": "integer"
                    },
                    {
                      "type": "null"
                    }
                  ]
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
    },
    "md_schemes_get": {
      "path": "/app-api/market-data/schemes/{id}",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "id",
          "fund_id",
          "fund_name",
          "amfi_code",
          "isin",
          "plan_code",
          "option_code",
          "status_code"
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
          "fund_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
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
          "plan_code": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ]
          },
          "option_code": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ]
          },
          "status_code": {
            "anyOf": [
              {
                "type": "integer"
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
    "md_amcs": {
      "path": "/app-api/market-data/amcs",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "query",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        }
      ],
      "response": {
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
                "name"
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "name": {
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
    },
    "md_amcs_get": {
      "path": "/app-api/market-data/amcs/{id}",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "id",
          "name"
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          },
          "name": {
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
    "md_managers": {
      "path": "/app-api/market-data/managers",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "query",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          }
        }
      ],
      "response": {
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
                "name"
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "name": {
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
    },
    "md_managers_get": {
      "path": "/app-api/market-data/managers/{id}",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "id",
          "name"
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[1-9][0-9]{0,18}$"
          },
          "name": {
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
    "md_categories": {
      "path": "/app-api/market-data/categories",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
        }
      ],
      "response": {
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
                "name"
              ],
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
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
    },
    "md_portfolios": {
      "path": "/app-api/market-data/funds/{id}/portfolios",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "from",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          }
        },
        {
          "name": "to",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "object",
          "data",
          "has_more",
          "next_cursor",
          "source",
          "from",
          "to",
          "coverage"
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
          },
          "from": {
            "type": "string",
            "format": "date"
          },
          "to": {
            "type": "string",
            "format": "date"
          },
          "coverage": {
            "const": "observations_only"
          }
        },
        "additionalProperties": true
      }
    },
    "md_navs": {
      "path": "/app-api/market-data/schemes/{id}/navs",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "from",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          }
        },
        {
          "name": "to",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "object",
          "data",
          "has_more",
          "next_cursor",
          "source",
          "from",
          "to",
          "coverage"
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
          },
          "from": {
            "type": "string",
            "format": "date"
          },
          "to": {
            "type": "string",
            "format": "date"
          },
          "coverage": {
            "const": "observations_only"
          }
        },
        "additionalProperties": true
      }
    },
    "md_expenses": {
      "path": "/app-api/market-data/schemes/{id}/expense-ratios",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
          "name": "from",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          }
        },
        {
          "name": "to",
          "in": "query",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          }
        }
      ],
      "response": {
        "type": "object",
        "required": [
          "object",
          "data",
          "has_more",
          "next_cursor",
          "source",
          "from",
          "to",
          "coverage"
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
          },
          "from": {
            "type": "string",
            "format": "date"
          },
          "to": {
            "type": "string",
            "format": "date"
          },
          "coverage": {
            "const": "observations_only"
          }
        },
        "additionalProperties": true
      }
    },
    "md_holdings": {
      "path": "/app-api/market-data/portfolios/{id}/holdings",
      "method": "GET",
      "status": 200,
      "marketData": true,
      "parameters": [
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
        }
      ],
      "response": {
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
    },
    "md_valuation": {
      "path": "/app-api/market-data/valuations",
      "method": "POST",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [],
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
    },
    "current_holdings": {
      "path": "/app-api/accounts/{account}/portfolios/{portfolio}/holdings/current",
      "method": "POST",
      "status": 201,
      "marketData": true,
      "parameters": [
        {
          "name": "account",
          "in": "path",
          "required": true,
          "description": "Authorized account or me.",
          "schema": {
            "anyOf": [
              {
                "const": "me"
              },
              {
                "type": "string",
                "pattern": "^acct_[a-f0-9]{32}$"
              }
            ]
          }
        },
        {
          "name": "portfolio",
          "in": "path",
          "required": true,
          "description": "Saved portfolio ID.",
          "schema": {
            "type": "string",
            "pattern": "^ptf_[a-f0-9]{32}$"
          }
        },
        {
          "name": "Idempotency-Key",
          "in": "header",
          "required": true,
          "schema": {
            "type": "string",
            "pattern": "^[!-~]{1,255}$"
          },
          "description": "Successful responses retained for 24 hours from server recording time; response record and mutation commit atomically. Retries do not extend retention; current authorization always required before replay."
        }
      ],
      "request": {
        "type": "object",
        "properties": {
          "source": {
            "type": "object",
            "properties": {
              "kind": {
                "type": "string",
                "enum": [
                  "user",
                  "statement"
                ]
              },
              "reference": {
                "type": "string",
                "minLength": 1,
                "maxLength": 255
              }
            },
            "required": [
              "kind",
              "reference"
            ],
            "additionalProperties": false
          },
          "holdings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "external_id": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 255
                },
                "investment_account": {
                  "type": "string",
                  "pattern": "^iac_[a-f0-9]{32}$"
                },
                "instrument": {
                  "type": "string",
                  "pattern": "^ins_[A-Za-z0-9_-]{1,150}$"
                },
                "observed_position": {
                  "type": "object",
                  "properties": {
                    "date": {
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                      "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
                    },
                    "quantity": {
                      "anyOf": [
                        {
                          "type": "string",
                          "pattern": "^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,4})?$"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "current_value": {
                      "type": "object",
                      "properties": {
                        "amount": {
                          "type": "string",
                          "pattern": "^(0|[1-9][0-9]{0,21})(\\.[0-9]{1,18})?$"
                        },
                        "currency": {
                          "const": "INR"
                        }
                      },
                      "required": [
                        "amount",
                        "currency"
                      ],
                      "additionalProperties": true
                    }
                  },
                  "required": [
                    "date"
                  ],
                  "additionalProperties": false
                },
                "expected_revision": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 1001
                }
              },
              "required": [
                "external_id",
                "investment_account",
                "instrument",
                "observed_position"
              ],
              "additionalProperties": false
            },
            "minItems": 1,
            "maxItems": 100
          }
        },
        "required": [
          "source",
          "holdings"
        ],
        "additionalProperties": false
      },
      "response": {
        "type": "object",
        "required": [
          "object",
          "account",
          "portfolio",
          "holdings"
        ],
        "properties": {
          "object": {
            "const": "history_import"
          },
          "account": {
            "type": "string"
          },
          "portfolio": {
            "type": "string"
          },
          "holdings": {
            "type": "array",
            "items": {
              "type": "object",
              "required": [
                "id",
                "quantity",
                "derivation",
                "revision"
              ],
              "properties": {
                "id": {
                  "type": "string"
                },
                "quantity": {
                  "type": "string",
                  "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                  "maxLength": 80
                },
                "derivation": {
                  "anyOf": [
                    {
                      "type": "object",
                      "required": [
                        "kind"
                      ],
                      "properties": {
                        "kind": {
                          "const": "supplied"
                        }
                      },
                      "additionalProperties": true
                    },
                    {
                      "type": "object",
                      "required": [
                        "kind",
                        "original_amount",
                        "position_date",
                        "nav",
                        "rounding",
                        "rounded"
                      ],
                      "properties": {
                        "kind": {
                          "const": "amount_divided_by_nav"
                        },
                        "original_amount": {
                          "type": "string",
                          "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                          "maxLength": 80
                        },
                        "position_date": {
                          "type": "string",
                          "format": "date",
                          "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
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
                              "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                              "maxLength": 80
                            },
                            "currency": {
                              "const": "INR"
                            },
                            "date": {
                              "type": "string",
                              "format": "date",
                              "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                            }
                          },
                          "additionalProperties": true
                        },
                        "rounding": {
                          "enum": [
                            "half_even_4_decimal_places",
                            "half_even_18_decimal_places"
                          ]
                        },
                        "rounded": {
                          "type": "boolean"
                        }
                      },
                      "additionalProperties": true
                    }
                  ]
                },
                "revision": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 1001
                }
              },
              "additionalProperties": true
            }
          }
        },
        "additionalProperties": true
      }
    },
    "current_asset_mix": {
      "path": "/app-api/accounts/{account}/portfolios/current_asset_mix",
      "method": "POST",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [
        {
          "name": "account",
          "in": "path",
          "required": true,
          "description": "Authorized account or me.",
          "schema": {
            "anyOf": [
              {
                "const": "me"
              },
              {
                "type": "string",
                "pattern": "^acct_[a-f0-9]{32}$"
              }
            ]
          }
        }
      ],
      "request": {
        "type": "object",
        "required": [
          "portfolio"
        ],
        "properties": {
          "portfolio": {
            "type": "object",
            "required": [
              "type",
              "id"
            ],
            "properties": {
              "type": {
                "const": "saved"
              },
              "id": {
                "type": "string",
                "pattern": "^ptf_[a-f0-9]{32}$"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      },
      "response": {
        "type": "object",
        "properties": {
          "object": {
            "const": "portfolio_mix"
          },
          "account": {
            "type": "string",
            "pattern": "^acct_[a-f0-9]{32}$"
          },
          "portfolio": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^ptf_[a-f0-9]{32}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "mix_type": {
            "const": "asset"
          },
          "engine_version": {
            "type": "string",
            "minLength": 1
          },
          "as_of_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
          },
          "valuation_date": {
            "anyOf": [
              {
                "type": "string",
                "format": "date",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
              },
              {
                "type": "null"
              }
            ]
          },
          "input_total": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "amount": {
                    "type": "string",
                    "pattern": "^(0|[1-9][0-9]{0,99})(\\.[0-9]{1,100})?$"
                  },
                  "currency": {
                    "const": "INR"
                  }
                },
                "required": [
                  "amount",
                  "currency"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "calculation_precision": {
            "const": "float64"
          },
          "source_roots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "mutual_fund_id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "portfolio_id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "date": {
                  "type": "string",
                  "format": "date",
                  "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
                }
              },
              "required": [
                "mutual_fund_id",
                "portfolio_id",
                "date"
              ],
              "additionalProperties": false
            },
            "minItems": 1,
            "maxItems": 100
          },
          "warnings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string",
                  "x-known-values": [
                    "float64_precision",
                    "threshold_contribution_skipped",
                    "nested_holdings_unavailable",
                    "missing_issuer_identity",
                    "cycle_detected",
                    "classifications_not_historical"
                  ],
                  "minLength": 1
                },
                "message": {
                  "type": "string"
                },
                "mutual_fund_id": {
                  "anyOf": [
                    {
                      "type": "string",
                      "pattern": "^[1-9][0-9]{0,17}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "path": {
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
              "required": [
                "code",
                "message",
                "mutual_fund_id",
                "path"
              ],
              "additionalProperties": false
            }
          },
          "mix": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "x-known-values": [
                  "available",
                  "unavailable"
                ],
                "minLength": 1
              },
              "denominator": {
                "const": "total_supplied_value_or_root_value"
              },
              "unavailable_reason": {
                "anyOf": [
                  {
                    "type": "string",
                    "x-known-values": [
                      "no_eligible_contributions"
                    ],
                    "minLength": 1
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "items": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "x-known-values": [
                        "cash",
                        "debt",
                        "equity",
                        "gold",
                        "other",
                        "unknown"
                      ],
                      "minLength": 1
                    },
                    "percentage": {
                      "type": "string",
                      "pattern": "^-?(1000000000000(\\.0{1,10})?|[0-9]{1,12}(\\.[0-9]{1,10})?)$"
                    }
                  },
                  "required": [
                    "code",
                    "percentage"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "status",
              "denominator",
              "unavailable_reason",
              "items"
            ],
            "additionalProperties": false
          },
          "position_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
          },
          "current_valuation": {
            "type": "object",
            "required": [
              "valuation_date",
              "holdings"
            ],
            "properties": {
              "valuation_date": {
                "type": "string",
                "format": "date"
              },
              "holdings": {
                "type": "array",
                "minItems": 1,
                "maxItems": 100,
                "items": {
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
                    "valuation_basis",
                    "holding",
                    "investment_account",
                    "instrument",
                    "revision",
                    "source",
                    "derivation"
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
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                    },
                    "ownership_status": {
                      "const": "user_supplied_not_verified",
                      "description": "Supplied quantities and dates are not independent verification of current ownership."
                    },
                    "valuation_basis": {
                      "const": "units_times_latest_nav",
                      "description": "Exact decimal units multiplied by latest positive INR NAV on or before as_of."
                    },
                    "holding": {
                      "type": "string"
                    },
                    "investment_account": {
                      "type": "string"
                    },
                    "instrument": {
                      "type": "string"
                    },
                    "revision": {
                      "anyOf": [
                        {
                          "type": "integer",
                          "minimum": 1
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "source": {
                      "type": "object",
                      "required": [
                        "kind",
                        "reference"
                      ],
                      "properties": {
                        "kind": {
                          "enum": [
                            "user",
                            "statement"
                          ]
                        },
                        "reference": {
                          "type": "string"
                        }
                      },
                      "additionalProperties": false
                    },
                    "derivation": {
                      "anyOf": [
                        {
                          "anyOf": [
                            {
                              "type": "object",
                              "required": [
                                "kind"
                              ],
                              "properties": {
                                "kind": {
                                  "const": "supplied"
                                }
                              },
                              "additionalProperties": true
                            },
                            {
                              "type": "object",
                              "required": [
                                "kind",
                                "original_amount",
                                "position_date",
                                "nav",
                                "rounding",
                                "rounded"
                              ],
                              "properties": {
                                "kind": {
                                  "const": "amount_divided_by_nav"
                                },
                                "original_amount": {
                                  "type": "string",
                                  "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                                  "maxLength": 80
                                },
                                "position_date": {
                                  "type": "string",
                                  "format": "date",
                                  "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
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
                                      "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                                      "maxLength": 80
                                    },
                                    "currency": {
                                      "const": "INR"
                                    },
                                    "date": {
                                      "type": "string",
                                      "format": "date",
                                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                                    }
                                  },
                                  "additionalProperties": true
                                },
                                "rounding": {
                                  "enum": [
                                    "half_even_4_decimal_places",
                                    "half_even_18_decimal_places"
                                  ]
                                },
                                "rounded": {
                                  "type": "boolean"
                                }
                              },
                              "additionalProperties": true
                            }
                          ]
                        },
                        {
                          "type": "null"
                        }
                      ]
                    }
                  },
                  "additionalProperties": true
                }
              }
            },
            "additionalProperties": false
          }
        },
        "required": [
          "object",
          "account",
          "portfolio",
          "mix_type",
          "engine_version",
          "as_of_date",
          "valuation_date",
          "input_total",
          "calculation_precision",
          "source_roots",
          "warnings",
          "mix",
          "current_valuation"
        ],
        "additionalProperties": true
      }
    },
    "current_sector_mix": {
      "path": "/app-api/accounts/{account}/portfolios/current_sector_mix",
      "method": "POST",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [
        {
          "name": "account",
          "in": "path",
          "required": true,
          "description": "Authorized account or me.",
          "schema": {
            "anyOf": [
              {
                "const": "me"
              },
              {
                "type": "string",
                "pattern": "^acct_[a-f0-9]{32}$"
              }
            ]
          }
        }
      ],
      "request": {
        "type": "object",
        "required": [
          "portfolio"
        ],
        "properties": {
          "portfolio": {
            "type": "object",
            "required": [
              "type",
              "id"
            ],
            "properties": {
              "type": {
                "const": "saved"
              },
              "id": {
                "type": "string",
                "pattern": "^ptf_[a-f0-9]{32}$"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      },
      "response": {
        "type": "object",
        "properties": {
          "object": {
            "const": "portfolio_mix"
          },
          "account": {
            "type": "string",
            "pattern": "^acct_[a-f0-9]{32}$"
          },
          "portfolio": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^ptf_[a-f0-9]{32}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "mix_type": {
            "const": "sector"
          },
          "engine_version": {
            "type": "string",
            "minLength": 1
          },
          "as_of_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
          },
          "valuation_date": {
            "anyOf": [
              {
                "type": "string",
                "format": "date",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
              },
              {
                "type": "null"
              }
            ]
          },
          "input_total": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "amount": {
                    "type": "string",
                    "pattern": "^(0|[1-9][0-9]{0,99})(\\.[0-9]{1,100})?$"
                  },
                  "currency": {
                    "const": "INR"
                  }
                },
                "required": [
                  "amount",
                  "currency"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "calculation_precision": {
            "const": "float64"
          },
          "source_roots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "mutual_fund_id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "portfolio_id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "date": {
                  "type": "string",
                  "format": "date",
                  "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
                }
              },
              "required": [
                "mutual_fund_id",
                "portfolio_id",
                "date"
              ],
              "additionalProperties": false
            },
            "minItems": 1,
            "maxItems": 100
          },
          "warnings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string",
                  "x-known-values": [
                    "float64_precision",
                    "threshold_contribution_skipped",
                    "nested_holdings_unavailable",
                    "missing_issuer_identity",
                    "cycle_detected",
                    "classifications_not_historical"
                  ],
                  "minLength": 1
                },
                "message": {
                  "type": "string"
                },
                "mutual_fund_id": {
                  "anyOf": [
                    {
                      "type": "string",
                      "pattern": "^[1-9][0-9]{0,17}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "path": {
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
              "required": [
                "code",
                "message",
                "mutual_fund_id",
                "path"
              ],
              "additionalProperties": false
            }
          },
          "mix": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "x-known-values": [
                  "available",
                  "unavailable"
                ],
                "minLength": 1
              },
              "denominator": {
                "const": "recursively_normalized_eligible_equity_sector_contributions"
              },
              "unavailable_reason": {
                "anyOf": [
                  {
                    "type": "string",
                    "x-known-values": [
                      "no_eligible_contributions"
                    ],
                    "minLength": 1
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "items": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "x-known-values": [
                        "not_set",
                        "agriculture",
                        "auto",
                        "cash_equivalents",
                        "chemicals",
                        "construction",
                        "consumer_discretionary",
                        "consumer_staples",
                        "defence",
                        "diversified",
                        "education",
                        "electronics",
                        "etf",
                        "energy_production",
                        "finance",
                        "furniture",
                        "government",
                        "healthcare",
                        "industrial_equipment",
                        "infrastructure",
                        "it_technology",
                        "logistics",
                        "media",
                        "outsourcing",
                        "packaging",
                        "paper_products",
                        "photographic_films",
                        "plastic_products",
                        "raw_materials",
                        "real_estate",
                        "restaurants",
                        "retail",
                        "shipping",
                        "telecom",
                        "textile",
                        "tobacco",
                        "trading",
                        "travel_lodging",
                        "utilities",
                        "other",
                        "not_applicable"
                      ],
                      "minLength": 1
                    },
                    "label": {
                      "type": "string"
                    },
                    "percentage": {
                      "type": "string",
                      "pattern": "^(100(\\.0{1,10})?|[0-9]{1,2}(\\.[0-9]{1,10})?)$"
                    }
                  },
                  "required": [
                    "code",
                    "label",
                    "percentage"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "status",
              "denominator",
              "unavailable_reason",
              "items"
            ],
            "additionalProperties": false
          },
          "position_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
          },
          "current_valuation": {
            "type": "object",
            "required": [
              "valuation_date",
              "holdings"
            ],
            "properties": {
              "valuation_date": {
                "type": "string",
                "format": "date"
              },
              "holdings": {
                "type": "array",
                "minItems": 1,
                "maxItems": 100,
                "items": {
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
                    "valuation_basis",
                    "holding",
                    "investment_account",
                    "instrument",
                    "revision",
                    "source",
                    "derivation"
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
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                    },
                    "ownership_status": {
                      "const": "user_supplied_not_verified",
                      "description": "Supplied quantities and dates are not independent verification of current ownership."
                    },
                    "valuation_basis": {
                      "const": "units_times_latest_nav",
                      "description": "Exact decimal units multiplied by latest positive INR NAV on or before as_of."
                    },
                    "holding": {
                      "type": "string"
                    },
                    "investment_account": {
                      "type": "string"
                    },
                    "instrument": {
                      "type": "string"
                    },
                    "revision": {
                      "anyOf": [
                        {
                          "type": "integer",
                          "minimum": 1
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "source": {
                      "type": "object",
                      "required": [
                        "kind",
                        "reference"
                      ],
                      "properties": {
                        "kind": {
                          "enum": [
                            "user",
                            "statement"
                          ]
                        },
                        "reference": {
                          "type": "string"
                        }
                      },
                      "additionalProperties": false
                    },
                    "derivation": {
                      "anyOf": [
                        {
                          "anyOf": [
                            {
                              "type": "object",
                              "required": [
                                "kind"
                              ],
                              "properties": {
                                "kind": {
                                  "const": "supplied"
                                }
                              },
                              "additionalProperties": true
                            },
                            {
                              "type": "object",
                              "required": [
                                "kind",
                                "original_amount",
                                "position_date",
                                "nav",
                                "rounding",
                                "rounded"
                              ],
                              "properties": {
                                "kind": {
                                  "const": "amount_divided_by_nav"
                                },
                                "original_amount": {
                                  "type": "string",
                                  "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                                  "maxLength": 80
                                },
                                "position_date": {
                                  "type": "string",
                                  "format": "date",
                                  "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
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
                                      "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                                      "maxLength": 80
                                    },
                                    "currency": {
                                      "const": "INR"
                                    },
                                    "date": {
                                      "type": "string",
                                      "format": "date",
                                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                                    }
                                  },
                                  "additionalProperties": true
                                },
                                "rounding": {
                                  "enum": [
                                    "half_even_4_decimal_places",
                                    "half_even_18_decimal_places"
                                  ]
                                },
                                "rounded": {
                                  "type": "boolean"
                                }
                              },
                              "additionalProperties": true
                            }
                          ]
                        },
                        {
                          "type": "null"
                        }
                      ]
                    }
                  },
                  "additionalProperties": true
                }
              }
            },
            "additionalProperties": false
          }
        },
        "required": [
          "object",
          "account",
          "portfolio",
          "mix_type",
          "engine_version",
          "as_of_date",
          "valuation_date",
          "input_total",
          "calculation_precision",
          "source_roots",
          "warnings",
          "mix",
          "current_valuation"
        ],
        "additionalProperties": true
      }
    },
    "current_issuer_mix": {
      "path": "/app-api/accounts/{account}/portfolios/current_issuer_mix",
      "method": "POST",
      "status": 200,
      "marketData": true,
      "readOnly": true,
      "parameters": [
        {
          "name": "account",
          "in": "path",
          "required": true,
          "description": "Authorized account or me.",
          "schema": {
            "anyOf": [
              {
                "const": "me"
              },
              {
                "type": "string",
                "pattern": "^acct_[a-f0-9]{32}$"
              }
            ]
          }
        }
      ],
      "request": {
        "type": "object",
        "required": [
          "portfolio"
        ],
        "properties": {
          "portfolio": {
            "type": "object",
            "required": [
              "type",
              "id"
            ],
            "properties": {
              "type": {
                "const": "saved"
              },
              "id": {
                "type": "string",
                "pattern": "^ptf_[a-f0-9]{32}$"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      },
      "response": {
        "type": "object",
        "properties": {
          "object": {
            "const": "portfolio_mix"
          },
          "account": {
            "type": "string",
            "pattern": "^acct_[a-f0-9]{32}$"
          },
          "portfolio": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^ptf_[a-f0-9]{32}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "mix_type": {
            "const": "issuer"
          },
          "engine_version": {
            "type": "string",
            "minLength": 1
          },
          "as_of_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
          },
          "valuation_date": {
            "anyOf": [
              {
                "type": "string",
                "format": "date",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
              },
              {
                "type": "null"
              }
            ]
          },
          "input_total": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "amount": {
                    "type": "string",
                    "pattern": "^(0|[1-9][0-9]{0,99})(\\.[0-9]{1,100})?$"
                  },
                  "currency": {
                    "const": "INR"
                  }
                },
                "required": [
                  "amount",
                  "currency"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "calculation_precision": {
            "const": "float64"
          },
          "source_roots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "mutual_fund_id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "portfolio_id": {
                  "type": "string",
                  "pattern": "^[1-9][0-9]{0,18}$"
                },
                "date": {
                  "type": "string",
                  "format": "date",
                  "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
                }
              },
              "required": [
                "mutual_fund_id",
                "portfolio_id",
                "date"
              ],
              "additionalProperties": false
            },
            "minItems": 1,
            "maxItems": 100
          },
          "warnings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string",
                  "x-known-values": [
                    "float64_precision",
                    "threshold_contribution_skipped",
                    "nested_holdings_unavailable",
                    "missing_issuer_identity",
                    "cycle_detected",
                    "classifications_not_historical"
                  ],
                  "minLength": 1
                },
                "message": {
                  "type": "string"
                },
                "mutual_fund_id": {
                  "anyOf": [
                    {
                      "type": "string",
                      "pattern": "^[1-9][0-9]{0,17}$"
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "path": {
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
              "required": [
                "code",
                "message",
                "mutual_fund_id",
                "path"
              ],
              "additionalProperties": false
            }
          },
          "mix": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "x-known-values": [
                  "available",
                  "unavailable"
                ],
                "minLength": 1
              },
              "denominator": {
                "const": "recursively_normalized_eligible_equity_issuer_contributions"
              },
              "unavailable_reason": {
                "anyOf": [
                  {
                    "type": "string",
                    "x-known-values": [
                      "no_eligible_contributions"
                    ],
                    "minLength": 1
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "items": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "issuer_type": {
                      "type": "string",
                      "minLength": 1
                    },
                    "issuer_id": {
                      "type": "string",
                      "pattern": "^[1-9][0-9]{0,18}$"
                    },
                    "name": {
                      "anyOf": [
                        {
                          "type": "string"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "percentage": {
                      "type": "string",
                      "pattern": "^(100(\\.0{1,10})?|[0-9]{1,2}(\\.[0-9]{1,10})?)$"
                    }
                  },
                  "required": [
                    "issuer_type",
                    "issuer_id",
                    "name",
                    "percentage"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "status",
              "denominator",
              "unavailable_reason",
              "items"
            ],
            "additionalProperties": false
          },
          "position_date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Real calendar date, 1900-01-01 through today Asia/Kolkata; replacement cannot move backwards."
          },
          "current_valuation": {
            "type": "object",
            "required": [
              "valuation_date",
              "holdings"
            ],
            "properties": {
              "valuation_date": {
                "type": "string",
                "format": "date"
              },
              "holdings": {
                "type": "array",
                "minItems": 1,
                "maxItems": 100,
                "items": {
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
                    "valuation_basis",
                    "holding",
                    "investment_account",
                    "instrument",
                    "revision",
                    "source",
                    "derivation"
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
                      "type": "string",
                      "format": "date",
                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                    },
                    "ownership_status": {
                      "const": "user_supplied_not_verified",
                      "description": "Supplied quantities and dates are not independent verification of current ownership."
                    },
                    "valuation_basis": {
                      "const": "units_times_latest_nav",
                      "description": "Exact decimal units multiplied by latest positive INR NAV on or before as_of."
                    },
                    "holding": {
                      "type": "string"
                    },
                    "investment_account": {
                      "type": "string"
                    },
                    "instrument": {
                      "type": "string"
                    },
                    "revision": {
                      "anyOf": [
                        {
                          "type": "integer",
                          "minimum": 1
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "source": {
                      "type": "object",
                      "required": [
                        "kind",
                        "reference"
                      ],
                      "properties": {
                        "kind": {
                          "enum": [
                            "user",
                            "statement"
                          ]
                        },
                        "reference": {
                          "type": "string"
                        }
                      },
                      "additionalProperties": false
                    },
                    "derivation": {
                      "anyOf": [
                        {
                          "anyOf": [
                            {
                              "type": "object",
                              "required": [
                                "kind"
                              ],
                              "properties": {
                                "kind": {
                                  "const": "supplied"
                                }
                              },
                              "additionalProperties": true
                            },
                            {
                              "type": "object",
                              "required": [
                                "kind",
                                "original_amount",
                                "position_date",
                                "nav",
                                "rounding",
                                "rounded"
                              ],
                              "properties": {
                                "kind": {
                                  "const": "amount_divided_by_nav"
                                },
                                "original_amount": {
                                  "type": "string",
                                  "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                                  "maxLength": 80
                                },
                                "position_date": {
                                  "type": "string",
                                  "format": "date",
                                  "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
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
                                      "pattern": "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
                                      "maxLength": 80
                                    },
                                    "currency": {
                                      "const": "INR"
                                    },
                                    "date": {
                                      "type": "string",
                                      "format": "date",
                                      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                                    }
                                  },
                                  "additionalProperties": true
                                },
                                "rounding": {
                                  "enum": [
                                    "half_even_4_decimal_places",
                                    "half_even_18_decimal_places"
                                  ]
                                },
                                "rounded": {
                                  "type": "boolean"
                                }
                              },
                              "additionalProperties": true
                            }
                          ]
                        },
                        {
                          "type": "null"
                        }
                      ]
                    }
                  },
                  "additionalProperties": true
                }
              }
            },
            "additionalProperties": false
          }
        },
        "required": [
          "object",
          "account",
          "portfolio",
          "mix_type",
          "engine_version",
          "as_of_date",
          "valuation_date",
          "input_total",
          "calculation_precision",
          "source_roots",
          "warnings",
          "mix",
          "current_valuation"
        ],
        "additionalProperties": true
      }
    }
  }
};

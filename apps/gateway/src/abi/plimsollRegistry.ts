export const plimsollRegistryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_forwarder",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "DOMAIN_SEPARATOR",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_LADDER",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_SCAN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowedSourceSet",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "bindAddress",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "deadline",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "bindNonce",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "boundAddresses",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "forwarder",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasStanding",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "metricId",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "threshold",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "k",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "window",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isAboveLine",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "metricId",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "threshold",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ladderOf",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct PlimsollTypes.Line[]",
        "components": [
          {
            "name": "metricId",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "comparator",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "threshold",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "publishBelow",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lineAt",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "lineId",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PlimsollTypes.Line",
        "components": [
          {
            "name": "metricId",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "comparator",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "threshold",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "publishBelow",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "markAt",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PlimsollTypes.Mark",
        "components": [
          {
            "name": "subjectId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "lineId",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "verdict",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "asOf",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "expiry",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "surveyId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "sourceSetHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "workflowId",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "markCount",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "postMark",
    "inputs": [
      {
        "name": "surveyId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "verdict",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "asOf",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "expiry",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "sourceSetHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "workflowId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rateMaxRequests",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rateWindow",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerLine",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "line",
        "type": "tuple",
        "internalType": "struct PlimsollTypes.Line",
        "components": [
          {
            "name": "metricId",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "comparator",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "threshold",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "publishBelow",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "lineId",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerSubject",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "remainingRequests",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "requester",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "requestSurvey",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "lineId",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [
      {
        "name": "surveyId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRateLimit",
    "inputs": [
      {
        "name": "maxRequests",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "window",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setSourceSet",
    "inputs": [
      {
        "name": "sourceSetHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "subjectOf",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "subjectOwner",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "surveyOf",
    "inputs": [
      {
        "name": "surveyId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PlimsollTypes.Survey",
        "components": [
          {
            "name": "subjectId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "requester",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "lineId",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "requestedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "fulfilled",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferSubjectOwner",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AddressBound",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LineRegistered",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "lineId",
        "type": "uint16",
        "indexed": true,
        "internalType": "uint16"
      },
      {
        "name": "metricId",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "threshold",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "publishBelow",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MarkPosted",
    "inputs": [
      {
        "name": "surveyId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "subjectId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "lineId",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "verdict",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "asOf",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "expiry",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "sourceSetHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "workflowId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RateLimitSet",
    "inputs": [
      {
        "name": "maxRequests",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "window",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SourceSetAllowed",
    "inputs": [
      {
        "name": "sourceSetHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "allowed",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SubjectOwnerTransferred",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SubjectRegistered",
    "inputs": [
      {
        "name": "subjectId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SurveyRequested",
    "inputs": [
      {
        "name": "surveyId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "subjectId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "lineId",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "requester",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "requestedAt",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyBound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AsOfInFuture",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadComparator",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadMetric",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadThreshold",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadVerdict",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BindExpired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ExpiryInPast",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LadderFull",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LineUnknown",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotForwarder",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotSubjectOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RateLimited",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SourceSetNotAllowed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SubjectTaken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SubjectUnknown",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SurveyAlreadyFulfilled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SurveyUnknown",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
] as const;

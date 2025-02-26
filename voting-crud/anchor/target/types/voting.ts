/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/voting.json`.
 */
export type Voting = {
  "address": "GinpHRVoJ35418tUBPyyRS3mptqTttHZ4BiQ5kB3h1g9",
  "metadata": {
    "name": "voting",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createPoll",
      "discriminator": [
        182,
        171,
        112,
        238,
        6,
        219,
        14,
        110
      ],
      "accounts": [
        {
          "name": "poll",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "options",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "deletePoll",
      "discriminator": [
        156,
        80,
        237,
        248,
        65,
        44,
        143,
        152
      ],
      "accounts": [
        {
          "name": "poll",
          "writable": true
        },
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "poll"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updatePoll",
      "discriminator": [
        188,
        131,
        217,
        106,
        140,
        114,
        130,
        5
      ],
      "accounts": [
        {
          "name": "poll",
          "writable": true
        },
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "poll"
          ]
        }
      ],
      "args": [
        {
          "name": "newTitle",
          "type": "string"
        },
        {
          "name": "newDescription",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "poll",
      "discriminator": [
        110,
        234,
        167,
        188,
        231,
        136,
        153,
        111
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only the creator of the poll can perform this operation."
    }
  ],
  "types": [
    {
      "name": "poll",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "options",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "votes",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "creator",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};

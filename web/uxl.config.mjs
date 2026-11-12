import { defineUxlConfig } from "@damsleth/ux-loop"

export default defineUxlConfig({
  "capture": {
    "runner": "playwright",
    "timeoutMs": 120000,
    "onboarding": {
      "status": "complete"
    },
    "flowInventory": [
      {
        "id": "shows-loading-and-then-loaded-data-state",
        "label": "shows loading and then loaded data state",
        "path": "/",
        "required": true
      },
      {
        "id": "search-updates-the-list-and-empty-state",
        "label": "search updates the list and empty state",
        "path": "/",
        "required": true
      },
      {
        "id": "sort-options-reorder-results",
        "label": "sort options reorder results",
        "path": "/",
        "required": true
      },
      {
        "id": "user-can-expand-a-beach-for-details",
        "label": "user can expand a beach for details",
        "path": "/",
        "required": true
      },
      {
        "id": "use-my-position-sorts-nearest-first",
        "label": "use my position sorts nearest first",
        "path": "/",
        "required": true
      },
      {
        "id": "error-and-stale-status-states-are-shown",
        "label": "error and stale status states are shown",
        "path": "/",
        "required": true
      }
    ],
    "flowMapping": {
      "shows-loading-and-then-loaded-data-state": [
        "shows-loading-and-then-loaded-data-state"
      ],
      "search-updates-the-list-and-empty-state": [
        "search-updates-the-list-and-empty-state"
      ],
      "sort-options-reorder-results": [
        "sort-options-reorder-results"
      ],
      "user-can-expand-a-beach-for-details": [
        "user-can-expand-a-beach-for-details"
      ],
      "use-my-position-sorts-nearest-first": [
        "use-my-position-sorts-nearest-first"
      ],
      "error-and-stale-status-states-are-shown": [
        "error-and-stale-status-states-are-shown"
      ]
    },
    "playwright": {
      "startCommand": {
        "command": "npm",
        "args": [
          "run",
          "dev",
          "--",
          "--host",
          "127.0.0.1",
          "--port",
          "4173"
        ]
      },
      "devices": [
        {
          "name": "mobile",
          "width": 390,
          "height": 844
        },
        {
          "name": "desktop",
          "width": 1280,
          "height": 800
        }
      ],
      "flows": [
        {
          "label": "shows loading and then loaded data state",
          "name": "shows-loading-and-then-loaded-data-state",
          "path": "/",
          "waitFor": "body",
          "settleMs": 200,
          "screenshot": {
            "fullPage": true
          }
        },
        {
          "label": "search updates the list and empty state",
          "name": "search-updates-the-list-and-empty-state",
          "path": "/",
          "waitFor": "body",
          "settleMs": 200,
          "screenshot": {
            "fullPage": true
          }
        },
        {
          "label": "sort options reorder results",
          "name": "sort-options-reorder-results",
          "path": "/",
          "waitFor": "body",
          "settleMs": 200,
          "screenshot": {
            "fullPage": true
          }
        },
        {
          "label": "user can expand a beach for details",
          "name": "user-can-expand-a-beach-for-details",
          "path": "/",
          "waitFor": "body",
          "settleMs": 200,
          "screenshot": {
            "fullPage": true
          }
        },
        {
          "label": "use my position sorts nearest first",
          "name": "use-my-position-sorts-nearest-first",
          "path": "/",
          "waitFor": "body",
          "settleMs": 200,
          "screenshot": {
            "fullPage": true
          }
        },
        {
          "label": "error and stale status states are shown",
          "name": "error-and-stale-status-states-are-shown",
          "path": "/",
          "waitFor": "body",
          "settleMs": 200,
          "screenshot": {
            "fullPage": true
          }
        }
      ]
    },
    "baseUrl": process.env.UI_REVIEW_BASE_URL || "http://127.0.0.1:4173"
  },
  "review": {
    "runner": "codex"
  },
  "implement": {
    "target": "worktree"
  }
})

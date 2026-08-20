export const reframeAudioSegments = [
    {
        "id": "segment_1",
        "text": "Hamare desh mein Prime Minister, yaani Pradhan Mantri, India ke real executive head hote hain.",
        "start": 0,
        "end": 5.735
    },
    {
        "id": "segment_2",
        "text": "Jabki President constitutional head hote hain.",
        "start": 6.177,
        "end": 8.533
    },
    {
        "id": "segment_3",
        "text": "Isko simple tarike se samjhne ke liye, aap yaad rakhiye ki President 'Head of the State' hote hain, aur Prime Minister 'Head of the Government' hote hain.",
        "start": 9.044,
        "end": 17.241
    },
    {
        "id": "segment_4",
        "text": "Asli mein sarkar Pradhan Mantri aur unki Council of Ministers hi chalati hai.",
        "start": 18.054,
        "end": 22.57
    }
]

export const sceneModelResponse = {
    "success": true,
    "scenes": {
        "scenes": [
            {
                "id": "scene_1",
                "type": "comparison",
                "start": 0,
                "end": 17.241,
                "narrationSegments": [
                    "segment_1",
                    "segment_2",
                    "segment_3"
                ],
                "data": {
                    "left": {
                        "title": "Prime Minister",
                        "description": "Real Executive Head\nHead of the Government"
                    },
                    "right": {
                        "title": "President",
                        "description": "Constitutional Head\nHead of the State"
                    }
                },
                "animation": {
                    "entrance": "fade",
                    "exit": "fade",
                    "emphasis": "highlight"
                }
            },
            {
                "id": "scene_2",
                "type": "concept",
                "start": 18.054,
                "end": 22.57,
                "narrationSegments": [
                    "segment_4"
                ],
                "data": {
                    "title": "Prime Minister",
                    "subtitle": "Runs Government with Council of Ministers"
                },
                "animation": {
                    "entrance": "fade",
                    "exit": "fade",
                    "emphasis": "highlight"
                }
            }
        ]
    },
    "message": "Scene plan generated",
    "service": "google",
    "err": ""
}

export const scenesEnglish = [
    {
        "id": "scene_1",
        "type": "comparison",
        "start": 0,
        "end": 13.27,
        "narrationSegments": [
            "segment_1",
            "segment_2"
        ],
        "data": {
            "left": {
                "title": "President",
                "description": "Head of the State\nRepresents the Nation"
            },
            "right": {
                "title": "Prime Minister",
                "description": "Head of the Government\nRuns Daily Administration"
            }
        },
        "animation": {
            "entrance": "fade",
            "exit": "fade"
        }
    },
    {
        "id": "scene_2",
        "type": "concept",
        "start": 13.27,
        "end": 24.055,
        "narrationSegments": [
            "segment_3",
            "segment_4"
        ],
        "data": {
            "title": "Constitutional Provisions",
            "subtitle": "PM's powers are not in a single article."
        },
        "animation": {
            "entrance": "fade",
            "exit": "fade"
        }
    },
    {
        "id": "scene_3",
        "type": "bulletPoints",
        "start": 24.439,
        "end": 41.935,
        "narrationSegments": [
            "segment_5",
            "segment_6"
        ],
        "data": {
            "title": "Key Constitutional Articles",
            "points": [
                "Article 74: Council of Ministers to aid & advise President",
                "Article 75: Appointment, Tenure, Salaries & Responsibilities of Ministers"
            ]
        },
        "animation": {
            "entrance": "fade",
            "exit": "fade"
        }
    }
]
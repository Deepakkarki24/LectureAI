import { Composition } from "remotion";
import { LectureVideo } from "./LectureVideo";
import { Scene } from "./types/scene";

const FPS = 30;

const getDurationInFrames = (sceneList: Scene[]) => {
    const maxEnd = Math.max(...sceneList.map((scene) => scene.end), 0);
    return Math.ceil(maxEnd * FPS);
};

const scenesEnglish = [
    {
        id: "scene_1",
        type: "comparison",
        start: 0,
        end: 13.27,
        narrationSegments: ["segment_1", "segment_2"],
        data: {
            left: {
                title: "President",
                description: "Head of the State\nRepresents the Nation",
            },
            right: {
                title: "Prime Minister",
                description: "Head of the Government\nRuns Daily Administration",
            },
        },
        animation: {
            entrance: "fade",
            exit: "fade",
        },
    },
    {
        id: "scene_2",
        type: "concept",
        start: 13.27,
        end: 24.055,
        narrationSegments: ["segment_3", "segment_4"],
        data: {
            title: "Constitutional Provisions",
            subtitle: "PM's powers are not in a single article.",
        },
        animation: {
            entrance: "fade",
            exit: "fade",
        },
    },
    {
        id: "scene_3",
        type: "bulletPoints",
        start: 24.439,
        end: 41.935,
        narrationSegments: ["segment_5", "segment_6"],
        data: {
            title: "Key Constitutional Articles",
            points: [
                "Article 74: Council of Ministers to aid & advise President",
                "Article 75: Appointment, Tenure, Salaries & Responsibilities of Ministers",
            ],
        },
        animation: {
            entrance: "fade",
            exit: "fade",
        },
    },
] satisfies Scene[];

const audioUrl =
    "https://res.cloudinary.com/doeojyev4/video/upload/v1787206162/audio/lectures/Prime_minister_Lecture/outro.mp3";

export const RemotionRoot = () => {
    return (
        <Composition
            id="LectureVideo"
            component={LectureVideo}
            durationInFrames={getDurationInFrames(scenesEnglish)}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={{
                audioUrl,
                scenes: scenesEnglish,
            }}
            calculateMetadata={({ props }) => ({
                durationInFrames: getDurationInFrames(props.scenes as Scene[]),
            })}
        />
    );
};

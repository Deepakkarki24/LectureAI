import { Composition } from "remotion";
import { LectureVideo } from "./LectureVideo";
import { LectureVideoProps, Scene } from "./types/scene";

const FPS = 30;

export const getDurationInFrames = (sceneList: Scene[]) => {
    if (sceneList.length === 0) {
        return 1;
    }

    const maxEnd = Math.max(...sceneList.map((scene) => scene.end));
    return Math.max(Math.ceil(maxEnd * FPS), 1);
};

const defaultProps: LectureVideoProps = {
    audioUrl: "",
    scenes: [],
};

export const RemotionRoot = () => {
    return (
        <Composition
            id="LectureVideo"
            component={LectureVideo}
            durationInFrames={1}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={defaultProps}
            calculateMetadata={({ props }) => ({
                durationInFrames: getDurationInFrames(props.scenes),
            })}
        />
    );
};

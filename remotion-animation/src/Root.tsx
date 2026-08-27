import { Composition } from "remotion";
import { LectureVideo } from "./LectureVideo";
import { LectureVideoProps } from "./types/scene";
import { loadImageAspectRatio } from "./utils/loadImageAspectRatio";

const FPS = 30;

export const getDurationInFrames = (props: LectureVideoProps) => {
    const ends = [
        ...props.scenes.map((scene) => scene.end),
        ...(props.pdfAnimationScenes ?? []).map((scene) => scene.end),
    ];

    if (ends.length === 0) {
        return 1;
    }

    return Math.max(Math.ceil(Math.max(...ends) * FPS), 1);
};

const defaultProps: LectureVideoProps = {
    audioUrl: "",
    scenes: [],
    pageImageUrls: [],
    pdfAnimationScenes: [],
    pageAspectRatios: [],
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
            calculateMetadata={async ({ props }) => {
                let pageAspectRatios = props.pageAspectRatios ?? [];

                if (
                    props.pageImageUrls &&
                    props.pageImageUrls.length > 0 &&
                    pageAspectRatios.length !== props.pageImageUrls.length
                ) {
                    pageAspectRatios = await Promise.all(
                        props.pageImageUrls.map((url) =>
                            loadImageAspectRatio(url)
                        )
                    );
                }

                return {
                    durationInFrames: getDurationInFrames(props),
                    props: {
                        ...props,
                        pageAspectRatios,
                    },
                };
            }}
        />
    );
};

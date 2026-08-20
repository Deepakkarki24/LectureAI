import { Composition } from "remotion";
import { LectureVideo } from "./LectureVideo";
import { Scene } from "./utils/parseSceneContent";

const FPS = 30;

const getDurationInFrames = (sceneList: Scene[]) => {
    const maxEnd = Math.max(...sceneList.map((scene) => scene.end), 0);
    return Math.ceil(maxEnd * FPS);
};

const scenes: Scene[] = [
    {
        id: "pm_01",
        start: 0.00,
        end: 7.40,
        text: "In India, the President is the constitutional head of the country, but the Prime Minister is the real executive head of the government.",
        page: 1,
        animation: "zoomIn",
        visualType: "comparison",
        visual: {
            title: "Executive Head of India",
            items: [
                {
                    title: "President",
                    subtitle: "Head of the State",
                },
                {
                    title: "Prime Minister",
                    subtitle: "Head of the Government",
                },
            ],
        },
    },

    {
        id: "pm_02",
        start: 7.40,
        end: 13.00,
        text: "A very easy trick to remember this is: President means Head of the State, while Prime Minister means Head of the Government.",
        page: 1,
        animation: "slideUp",
        visualType: "comparison",
        visual: {
            title: "Easy Trick",
            items: [
                {
                    title: "President",
                    subtitle: "Head of the State",
                },
                {
                    title: "Prime Minister",
                    subtitle: "Head of the Government",
                },
            ],
        },
    },

    {
        id: "pm_03",
        start: 13.00,
        end: 18.00,
        text: "Now, let us understand the constitutional provisions related to the Prime Minister.",
        page: 1,
        animation: "fadeIn",
        visualType: "title",
        visual: {
            title: "Constitutional Provisions",
            subtitle: "Prime Minister of India",
        },
    },

    {
        id: "pm_04",
        start: 18.00,
        end: 24.00,
        text: "The Constitution does not describe all the powers of the Prime Minister in a single article.",
        page: 1,
        animation: "zoomOut",
        visualType: "concept",
        visual: {
            title: "Prime Minister",
            subtitle: "Powers are not described in one single article",
        },
    },

    {
        id: "pm_05",
        start: 24.00,
        end: 30.00,
        text: "The position of the Prime Minister is mainly discussed through Article 74 and Article 75.",
        page: 1,
        animation: "zoomIn",
        visualType: "articles",
        visual: {
            title: "Key Constitutional Articles",
            items: [
                "Article 74",
                "Article 75",
            ],
        },
    },

    {
        id: "pm_06",
        start: 30.00,
        end: 36.50,
        text: "Article 74 deals with the Council of Ministers to aid and advise the President.",
        page: 1,
        animation: "slideRight",
        visualType: "article",
        visual: {
            title: "Article 74",
            items: [
                "Council of Ministers",
                "Aid and advise the President",
            ],
        },
    },

    {
        id: "pm_07",
        start: 36.50,
        end: 43.50,
        text: "And Article 75 deals with important matters related to ministers, including their appointment, tenure, salaries, and responsibilities.",
        page: 1,
        animation: "slideLeft",
        visualType: "article",
        visual: {
            title: "Article 75",
            items: [
                "Appointment",
                "Tenure",
                "Salaries",
                "Responsibilities",
            ],
        },
    },

    {
        id: "pm_08",
        start: 43.50,
        end: 48.00,
        text: "Now, how is the Prime Minister appointed?",
        page: 1,
        animation: "fadeIn",
        visualType: "question",
        visual: {
            title: "How is the Prime Minister appointed?",
        },
    },

    {
        id: "pm_09",
        start: 48.00,
        end: 52.50,
        text: "The President appoints the Prime Minister.",
        page: 1,
        animation: "zoomIn",
        visualType: "flow",
        visual: {
            title: "Appointment",
            flow: [
                "President",
                "↓",
                "Prime Minister",
            ],
        },
    },

    {
        id: "pm_10",
        start: 52.50,
        end: 60.50,
        text: "Usually, the leader of the political party, or a coalition, that has a majority in the Lok Sabha becomes the Prime Minister.",
        page: 1,
        animation: "slideUp",
        visualType: "flow",
        visual: {
            title: "Majority in Lok Sabha",
            flow: [
                "Political Party / Coalition",
                "↓",
                "Majority in Lok Sabha",
                "↓",
                "Prime Minister",
            ],
        },
    },

    {
        id: "pm_11",
        start: 60.50,
        end: 66.00,
        text: "But what happens if no political party gets a clear majority?",
        page: 1,
        animation: "fadeIn",
        visualType: "question",
        visual: {
            title: "What if there is no clear majority?",
            subtitle: "Hung Parliament",
        },
    },

    {
        id: "pm_12",
        start: 66.00,
        end: 71.00,
        text: "This situation is called a Hung Parliament.",
        page: 1,
        animation: "zoomIn",
        visualType: "definition",
        visual: {
            title: "Hung Parliament",
            subtitle: "No political party gets a clear majority",
        },
    },

    {
        id: "pm_13",
        start: 71.00,
        end: 80.00,
        text: "In such a situation, the President may invite the leader of the largest party, the leader of a coalition, or any person who can demonstrate majority support in the Lok Sabha.",
        page: 1,
        animation: "slideRight",
        visualType: "list",
        visual: {
            title: "Hung Parliament",
            items: [
                "Leader of the largest party",
                "Leader of a coalition",
                "Any person who can demonstrate majority support",
            ],
        },
    },

    {
        id: "pm_14",
        start: 80.00,
        end: 85.50,
        text: "But there is an important point here.",
        page: 1,
        animation: "fadeIn",
        visualType: "emphasis",
        visual: {
            title: "Important Point",
        },
    },

    {
        id: "pm_15",
        start: 85.50,
        end: 93.00,
        text: "The Prime Minister must prove majority support in the Lok Sabha through a Floor Test.",
        page: 1,
        animation: "zoomIn",
        visualType: "process",
        visual: {
            title: "Floor Test",
            flow: [
                "Prime Minister",
                "↓",
                "Majority Support",
                "↓",
                "Lok Sabha",
            ],
        },
    },

    {
        id: "pm_16",
        start: 93.00,
        end: 97.50,
        text: "Now let's talk about the qualifications of the Prime Minister.",
        page: 2,
        animation: "slideUp",
        visualType: "title",
        visual: {
            title: "Qualifications",
            subtitle: "Prime Minister of India",
        },
    },

    {
        id: "pm_17",
        start: 97.50,
        end: 103.00,
        text: "The Constitution does not prescribe any special qualifications specifically for becoming Prime Minister.",
        page: 2,
        animation: "fadeIn",
        visualType: "concept",
        visual: {
            title: "Qualifications",
            subtitle: "No special qualifications specifically prescribed",
        },
    },

    {
        id: "pm_18",
        start: 103.00,
        end: 111.00,
        text: "Normally, the Prime Minister should be an Indian citizen and should be a Member of Parliament, meaning a member of either the Lok Sabha or the Rajya Sabha.",
        page: 2,
        animation: "zoomIn",
        visualType: "list",
        visual: {
            title: "Normally, the PM should be",
            items: [
                "Indian citizen",
                "Member of Parliament",
                "Lok Sabha or Rajya Sabha",
            ],
        },
    },

    {
        id: "pm_19",
        start: 111.00,
        end: 117.50,
        text: "And what if a person is not an MP when appointed as Prime Minister?",
        page: 2,
        animation: "fadeIn",
        visualType: "question",
        visual: {
            title: "What if the person is not an MP?",
        },
    },

    {
        id: "pm_20",
        start: 117.50,
        end: 124.00,
        text: "That person must become a Member of Parliament within six months.",
        page: 2,
        animation: "zoomIn",
        visualType: "timeline",
        visual: {
            title: "Six-Month Rule",
            value: "6 Months",
            subtitle: "Must become a Member of Parliament",
        },
    },

    {
        id: "pm_21",
        start: 124.00,
        end: 128.50,
        text: "The person must also fulfil the qualifications required for election to Parliament.",
        page: 2,
        animation: "slideLeft",
        visualType: "concept",
        visual: {
            title: "Parliamentary Qualification",
            subtitle: "Must fulfil qualifications required for election to Parliament",
        },
    },

    {
        id: "pm_22",
        start: 128.50,
        end: 133.00,
        text: "Next comes the Oath of Office.",
        page: 2,
        animation: "fadeIn",
        visualType: "title",
        visual: {
            title: "Oath of Office",
        },
    },

    {
        id: "pm_23",
        start: 133.00,
        end: 139.00,
        text: "The President administers the oath to the Prime Minister.",
        page: 2,
        animation: "zoomIn",
        visualType: "flow",
        visual: {
            title: "Oath",
            flow: [
                "President",
                "↓",
                "Administers Oath",
                "↓",
                "Prime Minister",
            ],
        },
    },

    {
        id: "pm_24",
        start: 139.00,
        end: 146.00,
        text: "The Prime Minister takes two important oaths: the Oath of Office and the Oath of Secrecy.",
        page: 2,
        animation: "slideUp",
        visualType: "list",
        visual: {
            title: "Two Important Oaths",
            items: [
                "Oath of Office",
                "Oath of Secrecy",
            ],
        },
    },

    {
        id: "pm_25",
        start: 146.00,
        end: 154.96,
        text: "Now let's understand the term of office. The Prime Minister does not have a fixed tenure.",
        page: 2,
        animation: "zoomOut",
        visualType: "concept",
        visual: {
            title: "Term of Office",
            subtitle: "No fixed tenure",
        },
    },
];

const audioUrl = "https://res.cloudinary.com/doeojyev4/video/upload/v1787142166/ElevenLabs_2026-08-19T12_16_15_Viraj_-_Warm_Energetic_and_Lively_pvc_s50_f2-5_fklbld.mp3"

export const RemotionRoot = () => {
    return (
        <Composition
            id="LectureVideo"
            component={LectureVideo}
            durationInFrames={getDurationInFrames(scenes)}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={{
                audioUrl: audioUrl,
                scenes: scenes,
            }}
            calculateMetadata={({ props }) => ({
                durationInFrames: getDurationInFrames(props.scenes as Scene[]),
            })}
        />
    );
};
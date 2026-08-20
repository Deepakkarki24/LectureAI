export const ConceptScene = ({ scene }: any) => {

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <h1>
                {scene.data.title}
            </h1>

            <h2>
                {scene.data.subtitle}
            </h2>
        </div>
    );
};
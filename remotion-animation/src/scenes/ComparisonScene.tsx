export const ComparisonScene = ({ scene }: any) => {
    const { left, right } = scene.data;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 80,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <h1>{left.title}</h1>
                <p style={{ whiteSpace: "pre-line" }}>{left.description}</p>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <h1>{right.title}</h1>
                <p style={{ whiteSpace: "pre-line" }}>{right.description}</p>
            </div>
        </div>
    );
};

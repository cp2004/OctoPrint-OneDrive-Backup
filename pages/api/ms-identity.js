export default function handler(req, res) {
    res.status(200).json(
        {
            associatedApplications: [{
                applicationId: "1fbab959-f7f1-43c4-a800-5f7f58eb068f"
            }]
        }
    )
}

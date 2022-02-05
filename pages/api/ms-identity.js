export default function handler(req, res) {
    res.status(200).json(
        {
            associatedApplications: [{
                applicationId: "85591a87-4e78-4ced-a394-3d61bcca04ab"
            }]
        }
    )
}

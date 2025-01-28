import mongoose, { Schema } from "mongoose";

const PayoutsSchema = new Schema(
    {
        gameName: {
            type: String,
            required: true,
            unique: true
        },
        content: [
            {
                name: {
                    type: String,
                    required: true,
                },
                data: {
                    type: Schema.Types.Mixed,
                    required: true
                },
                version: Number,
                createdAt: { type: Date, default: Date.now }
            }
        ],
        latestVersion: { type: Number, default: 0 }
    },
    { timestamps: true }
)

const Payouts = mongoose.model("Payouts", PayoutsSchema);
export default Payouts;
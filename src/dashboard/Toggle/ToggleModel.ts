import mongoose, { Schema } from "mongoose";

interface IToggle extends Document {
  availableAt: Date | null; // null if no toggle is active
}

const toggleSchema = new Schema({
  availableAt: { type: Date, default: null } // time when the service will be available
});

const Toggle = mongoose.model<IToggle>('Toggle', toggleSchema);
export default Toggle;

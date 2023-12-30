import mongoose, {Mongoose} from "mongoose";


const AdminSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true
    },
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
)

const Admin = mongoose.model("Admin", AdminSchema)

export default Admin

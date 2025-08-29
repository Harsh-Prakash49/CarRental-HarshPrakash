import jwt from "jsonwebtoken";
import User from "../models/User.js";


const protect = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.json({ success: false, message: "Unauthorized - no token" });
    }

    try {
        const userId = jwt.decode(token, process.env.JWT_SECRET);
        if (!userId) {
            return res.json({ success: false, message: "Unauthorized - invalid token" })
        }
        req.user = await User.findById(userId).select("-password")
        next();
    
    } catch (error) {
        return res.json({ success: false, message: "Unauthorized" });
    }
}
export default protect;
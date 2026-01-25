import type { Express } from "express";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import * as multerStorageCloudinary from 'multer-storage-cloudinary';
import { storage as dbStorage } from "../../storage";

const CloudinaryStorage = (multerStorageCloudinary as any).CloudinaryStorage || 
                          (multerStorageCloudinary as any).default?.CloudinaryStorage || 
                          (multerStorageCloudinary as any).default;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  
  cloudinary: cloudinary, 
  params: {
    folder: 'task_guarantor_media',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'webm', 'quicktime'],
    public_id: (req: any, file: any) => 'file-' + Date.now(),
  },
});

const upload = multer({ storage: multer.memoryStorage() });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, });
export function registerObjectStorageRoutes(app: Express): void {

// Роут для прямой загрузки 
app.post("/api/uploads/direct", upload.single('file'), async (req: any, res: any) => {
  console.log("BODY:", req.body);
  try {
    console.log("Доступные методы storage:", Object.keys(dbStorage));
   const rawTaskId = req.query.taskId || req.body.taskId;
    const taskId = rawTaskId ? Number(rawTaskId) : null;

    console.log(`--- Получен запрос на загрузку для задачи #${taskId} ---`);
    
    if (!req.file) return res.status(400).json({ error: "Файл не получен" });

    // 2. Загружаем в Cloudinary
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const cloudinaryRes = await cloudinary.uploader.upload(base64Image, {
      folder: 'task_guarantor_media',
      resource_type: "auto",
    });

    const imageUrl = cloudinaryRes.secure_url;

    // 3. ОБНОВЛЯЕМ существующую запись в базе
    if (taskId && !isNaN(taskId)) {
      
      await dbStorage.submitEvidence(taskId, imageUrl);
      console.log(`✅ База данных успешно обновлена для задачи ${taskId}`);
    } else {
      console.error("⚠️ Ошибка: taskId не передан, ссылка не сохранена в БД");
    }

    res.json({ url: imageUrl, success: true });
  } catch (error: any) {
    console.error("❌ Ошибка на сервере:", error);
    res.status(500).json({ error: error.message });
  }
});

// Заглушка для фронтенда 
app.post("/api/uploads/request-url", async (req, res) => { res.json({ uploadURL: "/api/uploads/direct", objectPath: "pending", isCloudinary: true }); });

app.get("/objects/:objectPath(*)", async (req, res) => { res.status(404).json({ error: "Use direct links" }); }); }


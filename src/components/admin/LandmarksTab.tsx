import React, { useState } from "react";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2,
  Compass, 
  Navigation, 
  Map as MapIcon 
} from "lucide-react";
import { MapNode } from "../../types";

interface LandmarksTabProps {
  mapNodes: MapNode[];
  onAddMapNode: (node: MapNode) => void;
  onUpdateMapNode?: (node: MapNode) => void;
  onDeleteMapNode: (nodeId: string) => void;
}

export const LandmarksTab: React.FC<LandmarksTabProps> = ({
  mapNodes,
  onAddMapNode,
  onUpdateMapNode,
  onDeleteMapNode
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingNode, setEditingNode] = useState<MapNode | null>(null);
  const [arabicName, setArabicName] = useState("");
  const [xPos, setXPos] = useState(50);
  const [yPos, setYPos] = useState(50);
  const [nodeType, setNodeType] = useState<"landmark" | "intersection" | "store">("landmark");

  const openAddModal = () => {
    setEditingNode(null);
    setArabicName("");
    setXPos(50);
    setYPos(50);
    setNodeType("landmark");
    setShowModal(true);
  };

  const openEditModal = (node: MapNode) => {
    setEditingNode(node);
    setArabicName(node.arabicName || node.name);
    setXPos(node.x);
    setYPos(node.y);
    setNodeType(node.type || "landmark");
    setShowModal(true);
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabicName.trim()) return;

    if (editingNode) {
      const updated: MapNode = {
        ...editingNode,
        name: arabicName.trim(),
        arabicName: arabicName.trim(),
        x: Number(xPos),
        y: Number(yPos),
        type: nodeType
      };
      if (onUpdateMapNode) {
        onUpdateMapNode(updated);
      } else {
        onAddMapNode(updated);
      }
    } else {
      onAddMapNode({
        id: "node_" + Date.now(),
        name: arabicName.trim(),
        arabicName: arabicName.trim(),
        x: Number(xPos),
        y: Number(yPos),
        type: nodeType
      });
    }

    setEditingNode(null);
    setArabicName("");
    setXPos(50);
    setYPos(50);
    setShowModal(false);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setXPos(x);
    setYPos(y);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span>إدارة المعالم الجغرافية ومواقع الخريطة 📍</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">تحديد نقاط التوصيل ومعالم الأحياء والتقاطعات لتسهيل توجيه الكباتن وحساب المسافات</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة معلم جغرافي جديد 📍</span>
        </button>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Stage */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-400" />
              <span className="font-black text-xs text-white">خريطة القرية التفاعلية الحية</span>
            </div>
            <span className="text-[11px] text-slate-400">انقر على الخريطة لتحديد الإحداثيات</span>
          </div>

          <div 
            onClick={handleMapClick}
            className="relative w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-crosshair group shadow-inner"
          >
            {/* Grid Pattern Lines */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Connecting roads visual */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* Map Nodes Pins */}
            {mapNodes.map((node) => (
              <div
                key={node.id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/pin z-10"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white transition-transform group-hover/pin:scale-125 ${
                  node.type === "store" 
                    ? "bg-orange-500 text-white" 
                    : node.type === "landmark" 
                    ? "bg-emerald-500 text-white" 
                    : "bg-blue-500 text-white"
                }`}>
                  📍
                </div>
                <span className="opacity-0 group-hover/pin:opacity-100 transition-opacity bg-black/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap mt-1 border border-slate-700 pointer-events-none">
                  {node.arabicName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Landmarks List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h4 className="font-black text-xs text-slate-900">المعالم المسجلة ({mapNodes.length})</h4>
              <span className="text-[10px] text-slate-400">X% / Y%</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {mapNodes.map((node) => (
                <div key={node.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold">📍</span>
                    <div>
                      <h5 className="font-black text-slate-800">{node.arabicName}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">X: {node.x}% • Y: {node.y}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(node)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      title="تعديل المعلم"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`حذف المعلم "${node.arabicName}"؟`)) {
                          onDeleteMapNode(node.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="حذف المعلم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2 border-t">
            تستخدم المعالم لتحديد وجهات الزبائن ونقاط الالتقاء
          </div>
        </div>
      </div>

      {/* Add Landmark Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4 pb-48 sm:pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span>{editingNode ? "تعديل بيانات المعلم الجغرافي ✏️" : "إضافة معلم أو تقاطع جديد 📍"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNode} className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1">اسم المعلم باللغة العربية: *</label>
                <input
                  type="text"
                  required
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  placeholder="مثال: مفرق مدرسة البنات الثانوية"
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">نوع النقطة الجغرافية:</label>
                <select
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold focus:outline-hidden focus:border-orange-500"
                >
                  <option value="landmark">معلم عام بارز (جامع، مدرسة، مستوصف..)</option>
                  <option value="intersection">تقاطع طرق ومفارق رئيسية</option>
                  <option value="store">متجر أو مجمع تجاري</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">الموقع الأفقي (X %):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={xPos}
                    onChange={(e) => setXPos(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">الموقع الرأسي (Y %):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={yPos}
                    onChange={(e) => setYPos(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingNode ? "حفظ التعديلات 💾" : "حفظ المعلم 📍"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

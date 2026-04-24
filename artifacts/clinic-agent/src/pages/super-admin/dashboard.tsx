import { useState, useEffect, useCallback } from "react";
import { useSuperAdmin, SUPER_ADMIN_API } from "@/lib/super-admin-auth";
import { Shield, Plus, Building2, Users, Calendar, CheckCircle2, XCircle, LogOut, Pencil, X } from "lucide-react";

interface Clinic {
  id: number;
  name: string;
  slug: string;
  adminEmail: string;
  whatsappNumber: string | null;
  isActive: boolean;
  createdAt: string;
  doctorCount: number;
  appointmentCount: number;
}

interface ClinicForm {
  name: string;
  slug: string;
  adminEmail: string;
  password: string;
  whatsappNumber: string;
}

const emptyForm: ClinicForm = { name: "", slug: "", adminEmail: "", password: "", whatsappNumber: "" };

export default function SuperAdminDashboard() {
  const { logout } = useSuperAdmin();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [form, setForm] = useState<ClinicForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchClinics = useCallback(async () => {
    try {
      const res = await fetch(`${SUPER_ADMIN_API}/super-admin/clinics`, { credentials: "include" });
      if (res.ok) setClinics(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  const openAdd = () => {
    setEditingClinic(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setForm({
      name: clinic.name,
      slug: clinic.slug,
      adminEmail: clinic.adminEmail,
      password: "",
      whatsappNumber: clinic.whatsappNumber ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingClinic
        ? `${SUPER_ADMIN_API}/super-admin/clinics/${editingClinic.id}`
        : `${SUPER_ADMIN_API}/super-admin/clinics`;
      const method = editingClinic ? "PATCH" : "POST";
      const body: Record<string, string> = {
        name: form.name,
        adminEmail: form.adminEmail,
        whatsappNumber: form.whatsappNumber,
      };
      if (!editingClinic) body.slug = form.slug;
      if (form.password) body.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Something went wrong");
        return;
      }

      setShowForm(false);
      fetchClinics();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (clinic: Clinic) => {
    await fetch(`${SUPER_ADMIN_API}/super-admin/clinics/${clinic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !clinic.isActive }),
    });
    fetchClinics();
  };

  const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">ClinicAI — Super Admin</p>
              <p className="text-xs text-gray-500">Platform Management</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Clinics</p>
            <p className="text-2xl font-bold text-white">{clinics.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-400">{clinics.filter(c => c.isActive).length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Appointments</p>
            <p className="text-2xl font-bold text-indigo-400">{clinics.reduce((s, c) => s + c.appointmentCount, 0)}</p>
          </div>
        </div>

        {/* Clinics List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">All Clinics</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Clinic
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : clinics.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No clinics yet</p>
            <p className="text-sm text-gray-600 mt-1">Click "Add Clinic" to onboard your first client</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clinics.map(clinic => (
              <div key={clinic.id} className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 ${clinic.isActive ? "border-gray-800" : "border-gray-800 opacity-60"}`}>
                <div className="h-10 w-10 rounded-lg bg-indigo-900/50 border border-indigo-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white">{clinic.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${clinic.isActive ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>
                      {clinic.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{clinic.adminEmail}</p>
                  {clinic.whatsappNumber && (
                    <p className="text-xs text-gray-600 mt-0.5">WhatsApp: {clinic.whatsappNumber}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-center shrink-0">
                  <div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-sm font-semibold text-white">{clinic.doctorCount}</span>
                    </div>
                    <p className="text-[10px] text-gray-600">Doctors</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-sm font-semibold text-white">{clinic.appointmentCount}</span>
                    </div>
                    <p className="text-[10px] text-gray-600">Appts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(clinic)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(clinic)}
                    className={`p-2 rounded-lg transition-colors ${clinic.isActive ? "text-green-400 hover:text-red-400 hover:bg-red-900/20" : "text-gray-500 hover:text-green-400 hover:bg-green-900/20"}`}
                    title={clinic.isActive ? "Deactivate" : "Activate"}
                  >
                    {clinic.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">{editingClinic ? "Edit Clinic" : "Add New Clinic"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Clinic / Hospital Name</label>
                <input
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    setForm(f => ({ ...f, name, ...(editingClinic ? {} : { slug: toSlug(name) }) }));
                  }}
                  placeholder="e.g. Sharma Dental Clinic"
                  required
                />
              </div>

              {!editingClinic && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Slug (unique ID)</label>
                  <input
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
                    placeholder="e.g. sharma-dental"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">Admin Email (clinic login)</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  value={form.adminEmail}
                  onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="admin@theirclinic.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Password {editingClinic && <span className="text-gray-600">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editingClinic ? "Leave blank to keep unchanged" : "Set their login password"}
                  required={!editingClinic}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">WhatsApp Number <span className="text-gray-600">(optional)</span></label>
                <input
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  value={form.whatsappNumber}
                  onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              {error && (
                <div className="bg-red-900/30 text-red-400 text-sm px-3 py-2 rounded-lg border border-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingClinic ? "Save Changes" : "Create Clinic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

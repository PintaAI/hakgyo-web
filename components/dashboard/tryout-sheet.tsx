"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { saveTryout, getGuruSoalSetsForTryout, getGuruKelas } from "@/app/actions/kelas/tryout";
import { Tryout } from "./tryout-card";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface SoalSetOption {
  id: number;
  nama: string;
  _count: {
    soals: number;
  };
}

interface KelasOption {
  id: number;
  title: string;
  type: string;
  level: string;
  _count: {
    members: number;
  };
}

interface TryoutSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tryout?: Tryout | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TryoutSheet({ isOpen, onOpenChange, tryout, onSuccess, onCancel }: TryoutSheetProps) {
  const [saving, setSaving] = useState(false);
  const [soalSets, setSoalSets] = useState<SoalSetOption[]>([]);
  const [loadingSoalSets, setLoadingSoalSets] = useState(false);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [formData, setFormData] = useState({
    nama: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 30,
    maxAttempts: 1,
    shuffleQuestions: false,
    passingScore: 60,
    koleksiSoalId: "",
    kelasId: "global",
    isActive: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchSoalSets();
      fetchKelas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tryout) {
      setFormData({
        nama: tryout.nama,
        description: tryout.description || "",
        startTime: new Date(tryout.startTime).toISOString(),
        endTime: new Date(tryout.endTime).toISOString(),
        duration: tryout.duration,
        maxAttempts: tryout.maxAttempts,
        shuffleQuestions: tryout.shuffleQuestions,
        passingScore: tryout.passingScore,
        koleksiSoalId: tryout.koleksiSoalId.toString(),
        kelasId: tryout.kelasId?.toString() || "global",
        isActive: tryout.isActive,
      });
    } else {
      setFormData({
        nama: "",
        description: "",
        startTime: "",
        endTime: "",
        duration: 30,
        maxAttempts: 1,
        shuffleQuestions: false,
        passingScore: 60,
        koleksiSoalId: "",
        kelasId: "global",
        isActive: false,
      });
    }
  }, [tryout, isOpen]);

  const fetchSoalSets = async () => {
    setLoadingSoalSets(true);
    try {
      const result = await getGuruSoalSetsForTryout();
      if (result.success && result.data) {
        setSoalSets(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch soal sets:", error);
    } finally {
      setLoadingSoalSets(false);
    }
  };

  const fetchKelas = async () => {
    try {
      const result = await getGuruKelas();
      if (result.success && result.data) {
        setKelasList(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch kelas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await saveTryout(
        {
          nama: formData.nama,
          description: formData.description || undefined,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: formData.duration,
          maxAttempts: formData.maxAttempts,
          shuffleQuestions: formData.shuffleQuestions,
          passingScore: formData.passingScore,
          koleksiSoalId: parseInt(formData.koleksiSoalId),
          kelasId: formData.kelasId === "global" ? undefined : parseInt(formData.kelasId),
          isActive: formData.isActive,
        },
        tryout?.id
      );

      if (result.success) {
        toast.success(tryout ? "Tryout berhasil diperbarui" : "Tryout berhasil dibuat");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "Gagal menyimpan tryout");
      }
    } catch (error) {
      console.error("Failed to save tryout:", error);
      toast.error("Gagal menyimpan tryout");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    onCancel();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto m-0">
        <SheetHeader>
          <SheetTitle className="text-center">
            {tryout ? "Edit Tryout" : "Buat Tryout"}
          </SheetTitle>
        </SheetHeader>

        <div className="p-6">
          {loadingSoalSets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Tryout *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama tryout"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi tryout (opsional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="koleksiSoalId">Set Soal *</Label>
              <Select
                value={formData.koleksiSoalId}
                onValueChange={(value) => setFormData({ ...formData, koleksiSoalId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih set soal" />
                </SelectTrigger>
                <SelectContent>
                  {soalSets.map((soalSet) => (
                    <SelectItem key={soalSet.id} value={soalSet.id.toString()}>
                      {soalSet.nama} ({soalSet._count.soals} soal)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelasId">Kelas (Opsional)</Label>
              <Select
                value={formData.kelasId}
                onValueChange={(value) => setFormData({ ...formData, kelasId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (semua user)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (semua user)</SelectItem>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id.toString()}>
                      {kelas.title} ({kelas._count.members} member)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Waktu Mulai *</Label>
                <DateTimePicker
                  id="startTime"
                  value={formData.startTime}
                  onChange={(value) => setFormData({ ...formData, startTime: value })}
                  placeholder="Pilih waktu mulai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Waktu Selesai *</Label>
                <DateTimePicker
                  id="endTime"
                  value={formData.endTime}
                  onChange={(value) => setFormData({ ...formData, endTime: value })}
                  placeholder="Pilih waktu selesai"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Durasi (menit)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Maksimal Percobaan</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passingScore">Nilai Lulus (0-100)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 60 })}
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="shuffleQuestions">Acak Urutan Soal</Label>
                  <p className="text-xs text-muted-foreground">
                    Soal akan ditampilkan secara acak
                  </p>
                </div>
                <Switch
                  id="shuffleQuestions"
                  checked={formData.shuffleQuestions}
                  onCheckedChange={(checked) => setFormData({ ...formData, shuffleQuestions: checked })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Aktifkan Tryout</Label>
                <p className="text-xs text-muted-foreground">
                  Siswa dapat melihat dan mengikuti tryout
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.koleksiSoalId || !formData.nama || !formData.startTime || !formData.endTime}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

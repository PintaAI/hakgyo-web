"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useKelasBuilderStore } from "@/lib/stores/kelas-builder";
import { KelasMetaSchema } from "@/lib/validation/kelas-schemas";
import { KelasType, Difficulty } from "@/lib/prisma-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import NovelEditor from "@/components/novel/novel-editor";
import { MediaUpload } from "@/components/ui/media-upload";
import {
  BookOpen,
  DollarSign,
  Hash,
  Percent,
  Edit3
} from "lucide-react";
import Image from "next/image";

// Format number with thousand separators for better readability
function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

// Custom circular icon upload component
function CircularIconUpload({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const handleClick = () => {
    console.log('Icon upload clicked');
    // Set a default placeholder icon URL for now
    const defaultIconUrl = "https://cdn-icons-png.flaticon.com/128/5111/5111586.png";
    onChange(defaultIconUrl);
  };

  return (
    <div className="flex justify-center">
      <div
        className="relative group w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-primary/20 hover:border-primary/40 overflow-hidden"
        onClick={handleClick}
      >
        {value ? (
          <Image
            src={value}
            alt="Ikon kelas"
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <BookOpen className="h-8 w-8 text-primary/60" />
        )}
        
        {/* Hover Edit Icon */}
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Edit3 className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
}

export function StepMeta() {
  const {
    meta,
    updateMeta,
    saveMeta,
    clearError,
    isLoading,
  } = useKelasBuilderStore();

  const form = useForm({
    resolver: zodResolver(KelasMetaSchema),
    defaultValues: meta,
    mode: "onChange", // Validate on change
  });

  const { watch, formState: { errors,  } } = form;
  const watchedValues = watch();
  
  // Debounced update and save for meta step
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const hasActualChanges = JSON.stringify(watchedValues) !== JSON.stringify(meta);
    
    if (hasActualChanges) {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for 2 seconds after user stops typing
      console.log("Setting debounce timeout for form changes...");
      saveTimeoutRef.current = setTimeout(() => {
        console.log("Debounce timeout fired. Updating meta and saving...");
        // Update meta and then save
        updateMeta(watchedValues);
        // Give a small delay for the store to update, then save
        setTimeout(() => {
          saveMeta().catch(error => {
            console.error("Auto-save failed:", error);
          });
        }, 100);
      }, 2000);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [watchedValues, updateMeta, saveMeta, meta]);

  // Clear any existing errors when form is interacted with
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      clearError();
    }
  }, [errors, clearError]);

  const isPaidClass = watch("isPaidClass");

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form className="space-y-8" noValidate>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Title and Description - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Kelas *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan judul kelas Anda"
                            {...field}
                            className="text-lg"
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive title that tells students what they&apos;ll learn.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi Singkat</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Ringkasan singkat tentang apa yang akan dipelajari siswa..."
                            rows={3}
                            className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.description ? "border-destructive" : ""}`}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Ringkasan singkat yang muncul dalam daftar dan pratinjau kelas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Course Type and Difficulty - Below Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Kelas *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis kelas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(KelasType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the type of course you&apos;re creating.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tingkat Kesulitan *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tingkat kesulitan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(Difficulty).map((level) => (
                                <SelectItem key={level} value={level}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      level === 'BEGINNER' ? 'default' :
                                      level === 'INTERMEDIATE' ? 'secondary' :
                                      'destructive'
                                    }>
                                      {level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Pilih tingkat kesulitan yang sesuai untuk kelas Anda.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Icon and Thumbnail Upload - Takes 1 column */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Icon Section */}
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ikon Kelas</FormLabel>
                        <FormControl>
                          <CircularIconUpload
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription className="text-center">
                          Klik untuk mengunggah gambar ikon kelas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Thumbnail Section */}
                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail Kelas</FormLabel>
                        <FormControl>
                          <MediaUpload
                            accept="image/*"
                            maxFiles={1}
                            maxSize={5}
                            allowedTypes={['image']}
                            onUpload={(files) => {
                              if (files.length > 0) {
                                field.onChange(files[0].url);
                              }
                            }}
                            onRemove={() => {
                              field.onChange("");
                            }}
                            existingFiles={field.value ? [{
                              url: field.value,
                              publicId: 'existing',
                              format: 'jpg',
                              bytes: 0,
                              type: 'image'
                            }] : []}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Unggah gambar thumbnail yang menarik untuk kelas Anda (disarankan: 400x200px).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="htmlDescription"
                render={() => (
                  <FormItem>
                    <FormLabel>Deskripsi Lengkap</FormLabel>
                    <FormControl>
                      <NovelEditor
                        initialContent={watch("jsonDescription")}
                        onUpdate={(data: { json: any; html: string }) => {
                          console.log("📄 Novel Editor Update - JSON Description:", JSON.stringify(data.json, null, 2));
                          console.log("📄 Novel Editor Update - Has PDF node:", data.json?.content?.some((node: any) => node.type === 'pdf'));
                          form.setValue("jsonDescription", data.json, { shouldTouch: true, shouldDirty: true });
                          form.setValue("htmlDescription", data.html, { shouldTouch: true, shouldDirty: true });
                        }}
                        saveStatus={isLoading ? "Menyimpan..." : "Tersimpan"}
                        showTopToolbar={true}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi kelas lengkap dengan format kaya, tujuan pembelajaran, dan detail kurikulum.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          {/* Pengaturan Harga */}
          <Card >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pengaturan Harga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isPaidClass"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border  p-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Kursus Berbayar
                      </FormLabel>
                      <FormDescription>
                        Aktifkan jika Anda ingin memungut biaya untuk kursus Anda. Anda dapat mengubahnya kapan saja.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isPaidClass && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harga *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-sm text-muted-foreground">Rp</span>
                              <Input
                                type="number"
    
                               
                                className={`pl-9 ${errors.price ? "border-destructive" : ""}`}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  if (value >= 0 && value <= 999999990) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            </div>
                          </FormControl>
                       
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diskon %</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="20"
                                className={`pl-9 ${errors.discount ? "border-destructive" : ""}`}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  if (value >= 0 && value <= 100) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            </div>
                          </FormControl>
           
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="promoCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kode Promo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="SAVE20"
                                className="pl-9"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
            
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ringkasan Harga */}
                  <div className="bg-muted/50 rounded-lg p-4 ">
                    <h4 className="font-medium mb-3">Ringkasan Harga</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Harga Asli:</span>
                        <span className="font-medium">Rp {formatPrice(watchedValues.price || 0)}</span>
                      </div>
                      {watchedValues.discount && watchedValues.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Diskon ({watchedValues.discount}%):</span>
                          <span>-Rp {formatPrice((watchedValues.price || 0) * watchedValues.discount / 100)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-medium text-lg">
                        <span>Harga Akhir:</span>
                        <span className={watchedValues.discount && watchedValues.discount > 0 ? "text-green-600" : ""}>
                          Rp {formatPrice((watchedValues.price || 0) * (1 - (watchedValues.discount || 0) / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </form>
      </Form>
    </div>
  );
}

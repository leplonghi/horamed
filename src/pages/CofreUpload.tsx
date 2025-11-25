import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft, Loader2, Camera, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import { isPDF } from "@/lib/pdfProcessor";


export default function CofreUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMedications, setExtractedMedications] = useState<any[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);

  const { activeProfile } = useUserProfiles();

  const validateImageQuality = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file size
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return { valid: false, error: "Arquivo muito grande. Máximo: 20MB" };
    }

    // For images, check resolution
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        
        img.onload = () => {
          const minWidth = 800;
          const minHeight = 600;
          
          if (img.width < minWidth || img.height < minHeight) {
            resolve({ 
              valid: false, 
              error: `Imagem muito pequena (${img.width}x${img.height}). Mínimo recomendado: ${minWidth}x${minHeight}px` 
            });
          } else {
            resolve({ valid: true });
          }
        };
        
        img.onerror = () => {
          resolve({ valid: false, error: "Não foi possível ler a imagem" });
        };
        
        reader.readAsDataURL(file);
      });
    }
    
    return { valid: true };
  };

  const extractFromImage = async (base64: string) => {
    let attempts = 0;
    let success = false;
    
    while (attempts < 3 && !success) {
      try {
        const { data, error } = await supabase.functions.invoke('extract-document', {
          body: { image: base64 }
        });

        if (error) {
          if (error.message?.includes('400') || error.message?.includes('Invalid')) {
            throw error;
          }
          if (attempts === 2) throw error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }

        if (data) {
          success = true;
          return data;
        }
        break;
      } catch (err: any) {
        if (attempts === 2 || err.message?.includes('400') || err.message?.includes('Invalid')) {
          throw err;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);

      const firstFile = newFiles[0];
      if (firstFile) {
        // Validate quality first
        const validation = await validateImageQuality(firstFile);
        if (!validation.valid) {
          toast.error(validation.error, { duration: 6000 });
          setFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
          return;
        }

        setIsExtracting(true);
        setUploading(true);
        toast.loading("Analisando documento...", { id: "extract" });
        
        try {
          // First, upload the file
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado");

          const fileExt = firstFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          toast.loading("Enviando arquivo...", { id: "extract" });

          const { error: uploadError } = await supabase.storage
            .from('cofre-saude')
            .upload(filePath, firstFile);

          if (uploadError) throw uploadError;

          // Now extract data from the file
          toast.loading("Analisando conteúdo com IA...", { id: "extract" });

          if (isPDF(firstFile)) {
            console.log('Processando PDF completo...');
            
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64 = reader.result as string;
                const data = await extractFromImage(base64);
                
                if (data) {
                  await saveDocumentAutomatically(data, user.id, filePath, firstFile.type);
                } else {
                  throw new Error("Não foi possível extrair dados do PDF");
                }
              } catch (err) {
                await supabase.storage.from('cofre-saude').remove([filePath]);
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          } else {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;
              
              try {
                const data = await extractFromImage(base64);
                
                if (data) {
                  await saveDocumentAutomatically(data, user.id, filePath, firstFile.type);
                } else {
                  await supabase.storage.from('cofre-saude').remove([filePath]);
                  throw new Error("Não foi possível extrair informações da imagem");
                }
              } catch (err: any) {
                await supabase.storage.from('cofre-saude').remove([filePath]);
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          }
        } catch (error: any) {
          console.error('Erro ao processar documento:', error);
          toast.dismiss("extract");
          
          let errorMessage = "Não conseguimos processar o documento. ";
          let suggestions = "";
          
          if (error.message?.includes('Invalid') || error.message?.includes('formato')) {
            errorMessage = "Formato de arquivo inválido.";
            suggestions = "Use apenas PDF, PNG ou JPEG.";
          } else if (error.message?.includes('large') || error.message?.includes('size')) {
            errorMessage = "Arquivo muito grande.";
            suggestions = "Reduza o tamanho para menos de 20MB.";
          } else {
            errorMessage = "Qualidade insuficiente para leitura.";
            suggestions = "Dicas: tire foto com boa iluminação, evite sombras, mantenha o documento plano e use resolução mínima de 800x600px.";
          }
          
          toast.error(`${errorMessage} ${suggestions}`, { duration: 8000 });
          setIsExtracting(false);
          setUploading(false);
        }
      }
    }
  };

  const saveDocumentAutomatically = async (extractedData: any, userId: string, filePath: string, mimeType: string) => {
    try {
      toast.loading("Salvando documento...", { id: "extract" });

      const { data: categoriaData } = await supabase
        .from('categorias_saude')
        .select('id')
        .eq('slug', extractedData.category)
        .maybeSingle();

      // Build comprehensive metadata based on category
      const metaData: any = {
        doctor_name: extractedData.doctor_name,
        doctor_registration: extractedData.doctor_registration,
        specialty: extractedData.specialty,
        diagnosis: extractedData.diagnosis,
        notes: extractedData.notes,
        followup_date: extractedData.followup_date,
      };

      // RECEITA: Store all prescription details
      if (extractedData.category === 'receita' && extractedData.prescriptions?.length > 0) {
        metaData.prescriptions = extractedData.prescriptions.map((med: any) => ({
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          duration: med.duration,
          duration_days: med.duration_days,
          instructions: med.instructions,
          with_food: med.with_food,
        }));
        metaData.prescription_count = extractedData.prescriptions.length;
        metaData.prescription_date = extractedData.issued_at;
      }

      // EXAME: Store exam values
      if (extractedData.category === 'exame' && extractedData.extracted_values?.length > 0) {
        metaData.extracted_values = extractedData.extracted_values;
        metaData.exam_type = extractedData.exam_type;
      }

      // VACINAÇÃO: Store vaccine details
      if (extractedData.category === 'vacinacao') {
        metaData.vaccine_name = extractedData.vaccine_name;
        metaData.dose_number = extractedData.dose_number;
        metaData.next_dose_date = extractedData.next_dose_date;
      }

      const { data: newDoc, error: insertError } = await supabase
        .from('documentos_saude')
        .insert({
          user_id: userId,
          profile_id: activeProfile?.id,
          categoria_id: categoriaData?.id,
          title: extractedData.title,
          file_path: filePath,
          mime_type: mimeType,
          issued_at: extractedData.issued_at || null,
          expires_at: extractedData.expires_at || null,
          provider: extractedData.provider || null,
          confidence_score: extractedData.confidence_score || 0,
          status_extraction: 'confirmed',
          meta: metaData,
          ocr_text: JSON.stringify(extractedData),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create related records based on category
      const createdRecords = await createRelatedRecords(extractedData, newDoc.id, userId);

      toast.dismiss("extract");
      
      // Show comprehensive success message
      const createdItems = [];
      if (createdRecords.consulta) createdItems.push("✓ Consulta registrada");
      if (createdRecords.exame) createdItems.push(`✓ Exame com ${createdRecords.valoresCount || 0} parâmetro(s)`);
      if (createdRecords.evento) createdItems.push("✓ Lembrete de vacina criado");
      
      if (createdItems.length > 0) {
        toast.success("✓ Documento salvo com sucesso!", { duration: 4000 });
        toast.info(createdItems.join("\n"), { duration: 5000 });
      } else {
        toast.success("✓ Documento salvo!", { duration: 3000 });
      }
      
      // Show document summary
      const summary = [];
      if (extractedData.title) summary.push(`📄 ${extractedData.title}`);
      if (extractedData.provider) summary.push(`🏥 ${extractedData.provider}`);
      if (extractedData.doctor_name) {
        const doctorInfo = `👨‍⚕️ Dr(a). ${extractedData.doctor_name}`;
        if (extractedData.doctor_registration) {
          summary.push(`${doctorInfo} (CRM ${extractedData.doctor_registration})`);
        } else {
          summary.push(doctorInfo);
        }
      }
      if (extractedData.issued_at) summary.push(`📅 ${new Date(extractedData.issued_at).toLocaleDateString('pt-BR')}`);
      
      if (summary.length > 0) {
        toast.info(summary.join(" • "), { duration: 4000 });
      }

      // Check for medications to add
      if (extractedData.prescriptions && extractedData.prescriptions.length > 0) {
        setExtractedMedications(extractedData.prescriptions);
        setShowMedicationModal(true);
      } else {
        navigate(`/cofre/${newDoc.id}`);
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.dismiss("extract");
      toast.error("Erro ao salvar documento");
      await supabase.storage.from('cofre-saude').remove([filePath]);
    } finally {
      setIsExtracting(false);
      setUploading(false);
    }
  };

  const createRelatedRecords = async (extractedData: any, documentId: string, userId: string) => {
    const results: any = { consulta: false, exame: false, evento: false, valoresCount: 0 };
    
    try {
      // CONSULTA: Create consultation record
      if (extractedData.category === 'consulta') {
        const consultaData = {
          user_id: userId,
          profile_id: activeProfile?.id,
          documento_id: documentId,
          data_consulta: extractedData.issued_at || new Date().toISOString(),
          medico_nome: extractedData.doctor_name || null,
          especialidade: extractedData.specialty || null,
          local: extractedData.provider || null,
          observacoes: extractedData.diagnosis || extractedData.notes || null,
          status: 'realizada',
        };

        const { error } = await supabase.from('consultas_medicas').insert(consultaData);
        if (!error) results.consulta = true;
      }

      // EXAME: Create exam record with values
      if (extractedData.category === 'exame' && extractedData.extracted_values?.length > 0) {
        const { data: exame } = await supabase
          .from('exames_laboratoriais')
          .insert({
            user_id: userId,
            profile_id: activeProfile?.id,
            documento_id: documentId,
            data_exame: extractedData.issued_at || new Date().toISOString().split('T')[0],
            laboratorio: extractedData.provider || null,
          })
          .select()
          .single();

        if (exame) {
          results.exame = true;
          // Insert exam values
          const valores = extractedData.extracted_values.map((val: any) => ({
            exame_id: exame.id,
            parametro: val.parameter,
            valor: val.value ? parseFloat(val.value) : null,
            valor_texto: val.value?.toString() || null,
            unidade: val.unit || null,
            referencia_texto: val.reference_range || null,
            referencia_min: val.reference_min ? parseFloat(val.reference_min) : null,
            referencia_max: val.reference_max ? parseFloat(val.reference_max) : null,
            status: val.status || null,
          }));

          const { data: insertedValores } = await supabase.from('valores_exames').insert(valores).select();
          results.valoresCount = insertedValores?.length || 0;
        }
      }

      // VACINAÇÃO: Create health event
      if (extractedData.category === 'vacinacao') {
        const eventData = {
          user_id: userId,
          profile_id: activeProfile?.id,
          related_document_id: documentId,
          type: 'reforco_vacina' as const,
          title: extractedData.vaccine_name || 'Vacina',
          due_date: extractedData.next_dose_date || extractedData.issued_at || new Date().toISOString().split('T')[0],
          notes: extractedData.dose_number ? `Dose ${extractedData.dose_number}` : null,
        };

        const { error } = await supabase.from('eventos_saude').insert(eventData);
        if (!error) results.evento = true;
      }
    } catch (error) {
      console.error("Error creating related records:", error);
      // Don't throw - document is already saved
    }
    
    return results;
  };

  const addMedicationsFromPrescription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      toast.loading("Adicionando medicamentos...", { id: "add-meds" });

      for (const med of extractedMedications) {
        // Calculate treatment end date if duration is provided
        let endDate = null;
        if (med.duration_days) {
          const start = new Date();
          start.setDate(start.getDate() + parseInt(med.duration_days));
          endDate = start.toISOString().split('T')[0];
        }

        // Create medication item
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            profile_id: activeProfile?.id,
            name: med.drug_name,
            dose_text: med.dose,
            category: 'medicamento',
            notes: med.duration_days ? `Duração: ${med.duration_days} dias` : null,
            treatment_duration_days: med.duration_days ? parseInt(med.duration_days) : null,
            treatment_start_date: new Date().toISOString().split('T')[0],
            treatment_end_date: endDate,
          })
          .select()
          .single();

        if (itemError) {
          console.error("Error creating medication:", itemError);
          continue;
        }

        // Parse frequency and create schedule
        if (med.frequency && newItem) {
          const times = parseFrequencyToTimes(med.frequency);
          if (times.length > 0) {
            await supabase.from('schedules').insert({
              item_id: newItem.id,
              freq_type: 'daily',
              times: times,
              days_of_week: [0, 1, 2, 3, 4, 5, 6],
            });
          }
        }
      }

      toast.dismiss("add-meds");
      toast.success(`✓ ${extractedMedications.length} medicamento(s) adicionado(s) à sua rotina!`, { duration: 4000 });
      toast.info("Você receberá lembretes automáticos nos horários configurados", { duration: 4000 });
      setShowMedicationModal(false);
      navigate('/rotina');
    } catch (error) {
      console.error("Error adding medications:", error);
      toast.dismiss("add-meds");
      toast.error("Erro ao adicionar medicamentos");
    }
  };

  const parseFrequencyToTimes = (frequency: string): string[] => {
    // Parse common frequency patterns like "8/8h", "12/12h", "3x ao dia"
    const times: string[] = [];
    
    if (frequency.includes('8/8') || frequency.includes('8h')) {
      times.push('08:00', '16:00', '00:00');
    } else if (frequency.includes('12/12') || frequency.includes('12h')) {
      times.push('08:00', '20:00');
    } else if (frequency.includes('24/24') || frequency.includes('24h') || frequency.includes('1x')) {
      times.push('08:00');
    } else if (frequency.includes('6/6') || frequency.includes('6h')) {
      times.push('06:00', '12:00', '18:00', '00:00');
    } else if (frequency.includes('4/4') || frequency.includes('4h')) {
      times.push('06:00', '10:00', '14:00', '18:00', '22:00', '02:00');
    } else if (frequency.includes('3x')) {
      times.push('08:00', '14:00', '20:00');
    } else if (frequency.includes('2x')) {
      times.push('08:00', '20:00');
    } else {
      // Default to 3 times a day
      times.push('08:00', '14:00', '20:00');
    }
    
    return times;
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">{/* pt-24 para compensar o header fixo */}
        <Button variant="ghost" onClick={() => navigate("/cofre")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2">Adicionar Documento</h1>
        <p className="text-muted-foreground mb-6">
          Envie PDF ou foto. O HoraMed identifica o tipo e extrai os dados automaticamente.
        </p>

        {isExtracting && (
          <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Analisando documento com IA avançada...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processando e extraindo informações automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Requisitos para melhor extração
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 ml-6">
                <li>• <strong>Imagens:</strong> mínimo 800x600px, com boa iluminação e sem sombras</li>
                <li>• <strong>PDFs:</strong> preferir documentos com texto selecionável</li>
                <li>• <strong>Foco:</strong> documento deve estar nítido e plano</li>
                <li>• <strong>Tamanho:</strong> máximo 20MB por arquivo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Enviar Arquivo</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG ou PNG (até 20MB)
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Tirar Foto</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fotografar documento direto
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => navigate('/cofre/criar-manual')}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Edit3 className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Adicionar Manualmente</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Preencher informações sem arquivo
                      </p>
                    </div>
                  </div>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-6 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">{files[0].name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>✨ <strong>Extração e salvamento automáticos:</strong></p>
            <p>IA identifica exames, receitas, vacinas e consultas</p>
            <p>Dados são preenchidos e salvos automaticamente</p>
          </div>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="Cofre de documentos" />
      
      {/* Medication suggestion modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-lg animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Medicamentos da Receita</h2>
                  <p className="text-sm text-muted-foreground">
                    Adicionar à sua rotina de medicamentos
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>{extractedMedications.length} medicamento(s)</strong> encontrados nesta receita.
                  Vamos criar lembretes automáticos nos horários corretos!
                </p>
              </div>
              
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {extractedMedications.map((med, idx) => (
                  <div key={idx} className="p-4 border border-blue-200 dark:border-blue-800 bg-background rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💊</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{med.drug_name}</p>
                        <div className="text-sm space-y-1 mt-2">
                          {med.dose && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="w-5">💊</span>
                              <span>Dose: <strong>{med.dose}</strong></span>
                            </div>
                          )}
                          {med.frequency && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="w-5">⏰</span>
                              <span>Frequência: <strong>{med.frequency}</strong></span>
                            </div>
                          )}
                          {med.duration_days && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="w-5">📅</span>
                              <span>Duração: <strong>{med.duration_days} dias</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  ℹ️ Você poderá ajustar horários e doses depois na página "Rotina"
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowMedicationModal(false);
                      navigate('/cofre');
                    }}
                  >
                    Agora Não
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={addMedicationsFromPrescription}
                  >
                    ✓ Adicionar à Rotina
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Navigation />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useDocumento } from "@/hooks/useCofre";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CofreDocumentoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: documento, isLoading } = useDocumento(id);

  const [formData, setFormData] = useState({
    title: "",
    categoria_id: "",
    provider: "",
    issued_at: "",
    expires_at: "",
    notes: "",
    // Dados do Médico
    doctor_name: "",
    doctor_registration: "",
    doctor_state: "",
    specialty: "",
    // Dados do Emitente
    emitter_name: "",
    emitter_address: "",
    emitter_city: "",
    emitter_state: "",
    emitter_zip: "",
    emitter_phone: "",
    emitter_cnpj: "",
    // Dados do Paciente
    patient_name: "",
    patient_age: "",
    patient_cpf: "",
    patient_address: "",
    // Outros
    diagnosis: "",
    followup_date: "",
    prescription_type: "",
  });

  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  // Fetch categories
  const { data: categorias } = useQuery({
    queryKey: ["categorias_saude"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_saude")
        .select("*")
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (documento) {
      const meta = documento.meta as any;
      setFormData({
        title: documento.title || "",
        categoria_id: documento.categoria_id || "",
        provider: documento.provider || "",
        issued_at: documento.issued_at ? documento.issued_at.split("T")[0] : "",
        expires_at: documento.expires_at ? documento.expires_at.split("T")[0] : "",
        notes: documento.notes || "",
        // Dados do Médico
        doctor_name: meta?.doctor_name || "",
        doctor_registration: meta?.doctor_registration || "",
        doctor_state: meta?.doctor_state || "",
        specialty: meta?.specialty || "",
        // Dados do Emitente
        emitter_name: meta?.emitter_name || "",
        emitter_address: meta?.emitter_address || "",
        emitter_city: meta?.emitter_city || "",
        emitter_state: meta?.emitter_state || "",
        emitter_zip: meta?.emitter_zip || "",
        emitter_phone: meta?.emitter_phone || "",
        emitter_cnpj: meta?.emitter_cnpj || "",
        // Dados do Paciente
        patient_name: meta?.patient_name || "",
        patient_age: meta?.patient_age || "",
        patient_cpf: meta?.patient_cpf || "",
        patient_address: meta?.patient_address || "",
        // Outros
        diagnosis: meta?.diagnosis || "",
        followup_date: meta?.followup_date?.split("T")[0] || "",
        prescription_type: meta?.prescription_type || "",
      });
      
      if (meta?.prescriptions) {
        setPrescriptions(meta.prescriptions);
      }
    }
  }, [documento]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("documentos_saude")
        .update({
          title: data.title,
          categoria_id: data.categoria_id || null,
          provider: data.provider || null,
          issued_at: data.issued_at || null,
          expires_at: data.expires_at || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
          meta: {
            doctor_name: data.doctor_name,
            doctor_registration: data.doctor_registration,
            doctor_state: data.doctor_state,
            specialty: data.specialty,
            emitter_name: data.emitter_name,
            emitter_address: data.emitter_address,
            emitter_city: data.emitter_city,
            emitter_state: data.emitter_state,
            emitter_zip: data.emitter_zip,
            emitter_phone: data.emitter_phone,
            emitter_cnpj: data.emitter_cnpj,
            patient_name: data.patient_name,
            patient_age: data.patient_age,
            patient_cpf: data.patient_cpf,
            patient_address: data.patient_address,
            diagnosis: data.diagnosis,
            followup_date: data.followup_date,
            prescription_type: data.prescription_type,
            prescriptions: prescriptions,
            prescription_count: prescriptions.length,
            prescription_date: data.issued_at,
          }
        })
        .eq("id", id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documento", id] });
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Documento atualizado com sucesso!");
      navigate(`/carteira/${id}`);
    },
    onError: () => {
      toast.error("Erro ao atualizar documento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-96" />
        </div>
        <Navigation />
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
          <p>Documento não encontrado</p>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
        <Button variant="ghost" onClick={() => navigate(`/carteira/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Editar Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Básicas</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título do documento"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issued_at">Data de Emissão</Label>
                    <Input
                      id="issued_at"
                      type="date"
                      value={formData.issued_at}
                      onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Validade</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>

                {documento?.categorias_saude?.slug === 'receitas' && (
                  <div className="space-y-2">
                    <Label htmlFor="prescription_type">Tipo de Receita</Label>
                    <Select
                      value={formData.prescription_type}
                      onValueChange={(value) => setFormData({ ...formData, prescription_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Simples</SelectItem>
                        <SelectItem value="controlada">Controlada</SelectItem>
                        <SelectItem value="especial">Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Accordion com Seções Detalhadas */}
              <Accordion type="multiple" className="w-full">
                {/* Dados do Paciente */}
                <AccordionItem value="patient">
                  <AccordionTrigger>👤 Dados do Paciente</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient_name">Nome do Paciente</Label>
                      <Input
                        id="patient_name"
                        value={formData.patient_name}
                        onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patient_age">Idade</Label>
                        <Input
                          id="patient_age"
                          value={formData.patient_age}
                          onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                          placeholder="Ex: 45 anos"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="patient_cpf">CPF</Label>
                        <Input
                          id="patient_cpf"
                          value={formData.patient_cpf}
                          onChange={(e) => setFormData({ ...formData, patient_cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patient_address">Endereço</Label>
                      <Input
                        id="patient_address"
                        value={formData.patient_address}
                        onChange={(e) => setFormData({ ...formData, patient_address: e.target.value })}
                        placeholder="Endereço completo"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Identificação do Emitente */}
                <AccordionItem value="emitter">
                  <AccordionTrigger>🏥 Identificação do Emitente</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="emitter_name">Nome da Instituição</Label>
                      <Input
                        id="emitter_name"
                        value={formData.emitter_name}
                        onChange={(e) => setFormData({ ...formData, emitter_name: e.target.value })}
                        placeholder="Nome da clínica/hospital"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emitter_cnpj">CNPJ</Label>
                      <Input
                        id="emitter_cnpj"
                        value={formData.emitter_cnpj}
                        onChange={(e) => setFormData({ ...formData, emitter_cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emitter_address">Endereço</Label>
                      <Input
                        id="emitter_address"
                        value={formData.emitter_address}
                        onChange={(e) => setFormData({ ...formData, emitter_address: e.target.value })}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="emitter_city">Cidade</Label>
                        <Input
                          id="emitter_city"
                          value={formData.emitter_city}
                          onChange={(e) => setFormData({ ...formData, emitter_city: e.target.value })}
                          placeholder="Cidade"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emitter_state">UF</Label>
                        <Input
                          id="emitter_state"
                          value={formData.emitter_state}
                          onChange={(e) => setFormData({ ...formData, emitter_state: e.target.value })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emitter_zip">CEP</Label>
                        <Input
                          id="emitter_zip"
                          value={formData.emitter_zip}
                          onChange={(e) => setFormData({ ...formData, emitter_zip: e.target.value })}
                          placeholder="00000-000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emitter_phone">Telefone</Label>
                        <Input
                          id="emitter_phone"
                          value={formData.emitter_phone}
                          onChange={(e) => setFormData({ ...formData, emitter_phone: e.target.value })}
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Dados do Médico */}
                <AccordionItem value="doctor">
                  <AccordionTrigger>👨‍⚕️ Dados do Médico</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor_name">Nome do Médico</Label>
                      <Input
                        id="doctor_name"
                        value={formData.doctor_name}
                        onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                        placeholder="Dr(a). Nome completo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="doctor_registration">CRM</Label>
                        <Input
                          id="doctor_registration"
                          value={formData.doctor_registration}
                          onChange={(e) => setFormData({ ...formData, doctor_registration: e.target.value })}
                          placeholder="123456"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doctor_state">UF do CRM</Label>
                        <Input
                          id="doctor_state"
                          value={formData.doctor_state}
                          onChange={(e) => setFormData({ ...formData, doctor_state: e.target.value })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidade</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        placeholder="Ex: Cardiologia, Pediatria"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Medicamentos Prescritos */}
                {documento?.categorias_saude?.slug === 'receitas' && (
                  <AccordionItem value="prescriptions">
                    <AccordionTrigger>
                      💊 Medicamentos Prescritos ({prescriptions.length})
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {prescriptions.map((med, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold">Medicamento {idx + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nome do Medicamento *</Label>
                                <Input
                                  value={med.drug_name || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, drug_name: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Nome genérico"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Nome Comercial</Label>
                                <Input
                                  value={med.commercial_name || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, commercial_name: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Nome de marca"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Princípio Ativo</Label>
                              <Input
                                value={med.active_ingredient || ""}
                                onChange={(e) => {
                                  const newPrescriptions = [...prescriptions];
                                  newPrescriptions[idx] = { ...med, active_ingredient: e.target.value };
                                  setPrescriptions(newPrescriptions);
                                }}
                                placeholder="Ex: Amoxicilina triidratada"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={med.is_generic || false}
                                onCheckedChange={(checked) => {
                                  const newPrescriptions = [...prescriptions];
                                  newPrescriptions[idx] = { ...med, is_generic: checked };
                                  setPrescriptions(newPrescriptions);
                                }}
                              />
                              <Label>Medicamento Genérico</Label>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Dose</Label>
                                <Input
                                  value={med.dose || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, dose: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Ex: 500mg"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Input
                                  value={med.frequency || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, frequency: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Ex: 8/8h"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input
                                  value={med.duration || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, duration: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Ex: 7 dias"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Dias de Tratamento</Label>
                                <Input
                                  type="number"
                                  value={med.duration_days || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, duration_days: parseInt(e.target.value) };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="7"
                                />
                              </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Tipo de Embalagem</Label>
                                <Input
                                  value={med.package_type || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, package_type: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Ex: caixa, frasco"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Qtd. por Embalagem</Label>
                                <Input
                                  value={med.package_quantity || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, package_quantity: e.target.value };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Ex: 30 comp."
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Nº de Embalagens</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={med.packages_count || ""}
                                  onChange={(e) => {
                                    const newPrescriptions = [...prescriptions];
                                    newPrescriptions[idx] = { ...med, packages_count: parseInt(e.target.value) || null };
                                    setPrescriptions(newPrescriptions);
                                  }}
                                  placeholder="Ex: 2"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Instruções de Uso</Label>
                              <Textarea
                                value={med.instructions || ""}
                                onChange={(e) => {
                                  const newPrescriptions = [...prescriptions];
                                  newPrescriptions[idx] = { ...med, instructions: e.target.value };
                                  setPrescriptions(newPrescriptions);
                                }}
                                placeholder="Instruções adicionais"
                                rows={2}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={med.with_food || false}
                                onCheckedChange={(checked) => {
                                  const newPrescriptions = [...prescriptions];
                                  newPrescriptions[idx] = { ...med, with_food: checked };
                                  setPrescriptions(newPrescriptions);
                                }}
                              />
                              <Label>Tomar com alimento</Label>
                            </div>
                          </div>
                        </Card>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setPrescriptions([...prescriptions, {}])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Medicamento
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Informações Clínicas */}
                <AccordionItem value="clinical">
                  <AccordionTrigger>🔍 Informações Clínicas</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnóstico</Label>
                      <Textarea
                        id="diagnosis"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        placeholder="Diagnóstico ou condição"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Observações adicionais"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="followup_date">Data de Retorno</Label>
                      <Input
                        id="followup_date"
                        type="date"
                        value={formData.followup_date}
                        onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
          onClick={() => navigate(`/carteira/${id}`)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
}

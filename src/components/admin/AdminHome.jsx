import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminHome({ userId }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from("copy")
        .select("*")
        .eq("page", "home")
        .eq("locale", "es");

      if (error) throw error;

      // Convertir a estructura anidada
      const structured = {};
      data.forEach((item) => {
        const keys = item.key.split(".");
        let current = structured;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }

        let value = item.value;
        if (
          typeof value === "string" &&
          (value.startsWith("[") || value.startsWith("{"))
        ) {
          try {
            value = JSON.parse(value);
          } catch (e) {}
        }

        current[keys[keys.length - 1]] = value;
      });

      setContent(structured);
      setLoading(false);
    } catch (err) {
      console.error("error cargando:", err);
      setMessage({ type: "error", text: "Error al cargar contenido" });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Convertir estructura anidada a registros planos
      const records = [];
      const flatten = (obj, prefix = "") => {
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const value = obj[key];

          if (value && typeof value === "object" && !Array.isArray(value)) {
            flatten(value, fullKey);
          } else {
            const finalValue =
              typeof value === "object" ? JSON.stringify(value) : value;
            records.push({
              page: "home",
              key: fullKey,
              value: finalValue,
              type:
                fullKey.includes("image") && !fullKey.includes("Alt")
                  ? "image"
                  : "text",
              locale: "es",
              owner: userId,
            });
          }
        }
      };

      flatten(content);

      for (const record of records) {
        const { error } = await supabase
          .from("copy")
          .upsert(record, { onConflict: "page,key,locale" });

        if (error) throw error;
      }

      setMessage({ type: "success", text: "Cambios guardados correctamente" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("error guardando:", err);
      setMessage({ type: "error", text: "Error al guardar: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    const newContent = { ...content };
    const keys = path.split(".");
    let current = newContent;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setContent(newContent);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
          Hero Principal
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Título Principal
            </label>
            <input
              type="text"
              value={content.hero?.title || ""}
              onChange={(e) => updateField("hero.title", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              placeholder="Asesoría integral para empresas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Áreas de Servicio
            </label>
            <input
              type="text"
              value={content.hero?.areas || ""}
              onChange={(e) => updateField("hero.areas", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              placeholder="Fiscal · Laboral · Contable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={content.hero?.description || ""}
              onChange={(e) => updateField("hero.description", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              placeholder="Gestionamos tus recursos..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Texto Botón 1
              </label>
              <input
                type="text"
                value={content.hero?.button1Text || ""}
                onChange={(e) =>
                  updateField("hero.button1Text", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Texto Botón 2
              </label>
              <input
                type="text"
                value={content.hero?.button2Text || ""}
                onChange={(e) =>
                  updateField("hero.button2Text", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Imagen de Fondo del Hero
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={content.hero?.image || ""}
                onChange={(e) => updateField("hero.image", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="/bg.jpg"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `hero/${Date.now()}.${fileExt}`;
                      
                      const { error } = await supabase.storage
                        .from('assets')
                        .upload(fileName, file);
                      
                      if (error) throw error;
                      
                      const { data: { publicUrl } } = supabase.storage
                        .from('assets')
                        .getPublicUrl(fileName);
                      
                      updateField('hero.image', publicUrl);
                      setMessage({ type: 'success', text: 'Imagen subida correctamente' });
                      setTimeout(() => setMessage(null), 3000);
                    } catch (err) {
                      setMessage({ type: 'error', text: 'Error al subir imagen: ' + err.message });
                    }
                  }}
                  className="text-sm"
                />
                <span className="text-xs text-gray-500">o pega una URL</span>
              </div>
              {content.hero?.image && (
                <img
                  src={content.hero.image}
                  alt="Preview"
                  className="max-w-xs rounded-lg border border-gray-200"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Texto Alt de la Imagen (para SEO)
            </label>
            <input
              type="text"
              value={content.hero?.imageAlt || ""}
              onChange={(e) => updateField("hero.imageAlt", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              placeholder="Asesoría profesional"
            />
          </div>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
          Sobre Nosotros
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Título de Sección
            </label>
            <input
              type="text"
              value={content.sobreNosotros?.title || ""}
              onChange={(e) =>
                updateField("sobreNosotros.title", e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
          </div>

          {content.sobreNosotros?.intro?.map((paragraph, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-2">
                Párrafo {index + 1}
              </label>
              <textarea
                rows={2}
                value={paragraph}
                onChange={(e) => {
                  const newIntro = [...(content.sobreNosotros.intro || [])];
                  newIntro[index] = e.target.value;
                  updateField("sobreNosotros.intro", newIntro);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Misión - Descripción
              </label>
              <textarea
                rows={2}
                value={content.sobreNosotros?.mision?.description || ""}
                onChange={(e) =>
                  updateField(
                    "sobreNosotros.mision.description",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Visión - Descripción
              </label>
              <textarea
                rows={2}
                value={content.sobreNosotros?.vision?.description || ""}
                onChange={(e) =>
                  updateField(
                    "sobreNosotros.vision.description",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
          </div>

           <div>
             <label className="block text-sm font-medium mb-2">Valores</label>
             {content.sobreNosotros?.valores?.items?.map((item, index) => (
               <div key={index} className="flex gap-2 mb-2">
                 <input
                   type="text"
                   value={item.label}
                   onChange={(e) => {
                     const newItems = [
                       ...(content.sobreNosotros.valores.items || []),
                     ];
                     newItems[index].label = e.target.value;
                     updateField("sobreNosotros.valores.items", newItems);
                   }}
                   className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                   placeholder="Etiqueta:"
                 />
                 <input
                   type="text"
                   value={item.description}
                   onChange={(e) => {
                     const newItems = [
                       ...(content.sobreNosotros.valores.items || []),
                     ];
                     newItems[index].description = e.target.value;
                     updateField("sobreNosotros.valores.items", newItems);
                   }}
                   className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                   placeholder="descripción"
                 />
               </div>
             ))}
           </div>

           <div>
             <label className="block text-sm font-medium mb-2">
               Imagen del Equipo
             </label>
             <div className="space-y-2">
               <input
                 type="text"
                 value={content.sobreNosotros?.image || ""}
                 onChange={(e) => updateField("sobreNosotros.image", e.target.value)}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                 placeholder="/img/nosotros.png"
               />
               <div className="flex items-center gap-2">
                 <input
                   type="file"
                   accept="image/*"
                   onChange={async (e) => {
                     const file = e.target.files[0];
                     if (!file) return;
                     
                     try {
                       const fileExt = file.name.split('.').pop();
                       const fileName = `sobre-nosotros/${Date.now()}.${fileExt}`;
                       
                       const { error } = await supabase.storage
                         .from('assets')
                         .upload(fileName, file);
                       
                       if (error) throw error;
                       
                       const { data: { publicUrl } } = supabase.storage
                         .from('assets')
                         .getPublicUrl(fileName);
                       
                       updateField('sobreNosotros.image', publicUrl);
                       setMessage({ type: 'success', text: 'Imagen subida correctamente' });
                       setTimeout(() => setMessage(null), 3000);
                     } catch (err) {
                       setMessage({ type: 'error', text: 'Error al subir imagen: ' + err.message });
                     }
                   }}
                   className="text-sm"
                 />
                 <span className="text-xs text-gray-500">o pega una URL</span>
               </div>
               {content.sobreNosotros?.image && (
                 <img
                   src={content.sobreNosotros.image}
                   alt="Preview"
                   className="max-w-xs rounded-lg border border-gray-200"
                 />
               )}
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium mb-2">
               Texto Alt de la Imagen (para SEO)
             </label>
             <input
               type="text"
               value={content.sobreNosotros?.imageAlt || ""}
               onChange={(e) => updateField("sobreNosotros.imageAlt", e.target.value)}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
               placeholder="Equipo de trabajo de Haion Consulting"
             />
           </div>
         </div>
       </section>

      {/* CTA Final */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
          Llamada a la Acción (CTA)
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Título del CTA
            </label>
            <textarea
              rows={2}
              value={content.cta?.title || ""}
              onChange={(e) => updateField("cta.title", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subtítulo</label>
            <input
              type="text"
              value={content.cta?.subtitle || ""}
              onChange={(e) => updateField("cta.subtitle", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Texto del Botón
            </label>
            <input
              type="text"
              value={content.cta?.buttonText || ""}
              onChange={(e) => updateField("cta.buttonText", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Texto Footer
            </label>
            <input
              type="text"
              value={content.cta?.footer || ""}
              onChange={(e) => updateField("cta.footer", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              placeholder="Te respondemos en menos de 24 horas"
            />
          </div>
        </div>
      </section>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-yellow-200 hover:bg-yellow-300 disabled:bg-gray-300 text-gray-800 font-semibold rounded-lg"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}

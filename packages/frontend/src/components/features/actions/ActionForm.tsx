import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { type ActionTemplate, ActionFieldType, type ActionFieldDefinition } from "@live-chat/shared-types";
import { Button } from "../../ui/Button";
import { useTranslation } from "react-i18next";
import { actionsApi } from "../../../services/actionApi";
import { Spinner } from "../../ui/Spinner";
import { Select } from "../../ui/Select";

interface ActionFormProps {
  template: ActionTemplate;
  conversationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ActionForm: React.FC<ActionFormProps> = ({
  template,
  conversationId,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    setServerError(null);
    try {
      await actionsApi.createSubmission(conversationId, template.id, data);
      onSuccess();
    } catch (err: any) {
      setServerError(err.response?.data?.message || t("common.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md">
      <h3 className="font-semibold text-lg">{template.name}</h3>
      {template.description && (
        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
      )}

      {template.definition.fields.map((field: ActionFieldDefinition) => (
        <div key={field.key} className="space-y-1">
          <label className="block text-sm font-medium" htmlFor={field.key}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <Controller
            name={field.key}
            control={control}
            rules={{
              required: field.required ? t("common.required") : false,
              validate: field.type === ActionFieldType.DATE && field.required
                ? (value: string) => {
                    if (!value) return t("common.required");
                    const parts = value.split("/");
                    const day = parts[0]?.trim();
                    const month = parts[1]?.trim();
                    const year = parts[2]?.trim();
                    if (!day || !month || !year || year.length < 4) {
                      return t("common.required");
                    }
                    return true;
                  }
                : undefined,
            }}
            render={({ field: { onChange, value } }) => {
              if (field.type === ActionFieldType.TEXT) {
                return (
                  <input
                    id={field.key}
                    type="text"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={onChange}
                    value={value || ""}
                  />
                );
              }
              if (field.type === ActionFieldType.NUMBER) {
                return (
                  <input
                    id={field.key}
                    type="number"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => onChange(Number(e.target.value))}
                    value={value || ""}
                  />
                );
              }
              if (field.type === ActionFieldType.BOOLEAN) {
                return (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!value}
                      onClick={() => onChange(!value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        value ? "bg-green-600" : "bg-zinc-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                          value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {value ? t("common.yes") : t("common.no")}
                    </span>
                  </div>
                );
              }
              if (field.type === ActionFieldType.DATE) {
                // Parse existing value (dd/mm/yyyy format)
                const parts = (value || "").split("/");
                const day = parts[0] || "";
                const month = parts[1] || "";
                const year = parts[2] || "";

                const updateDate = (d: string, m: string, y: string) => {
                  onChange(`${d}/${m}/${y}`);
                };

                // Validate and clamp day (1-31)
                const validateDay = (v: string): string => {
                  if (!v) return v;
                  const num = parseInt(v, 10);
                  if (isNaN(num)) return "";
                  if (num > 31) return "31";
                  if (num < 0) return "01";
                  return v;
                };

                // Validate and clamp month (1-12)
                const validateMonth = (v: string): string => {
                  if (!v) return v;
                  const num = parseInt(v, 10);
                  if (isNaN(num)) return "";
                  if (num > 12) return "12";
                  if (num < 0) return "01";
                  return v;
                };

                const inputClass = "h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm text-center shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

                const monthInputId = `${field.key}-month`;
                const yearInputId = `${field.key}-year`;

                return (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="DD"
                      maxLength={2}
                      className={`${inputClass} w-12`}
                      value={day}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        v = validateDay(v);
                        updateDate(v, month, year);
                        // Auto-jump to month when 2 digits entered
                        if (v.length === 2) {
                          document.getElementById(monthInputId)?.focus();
                        }
                      }}
                    />
                    <span className="text-muted-foreground">/</span>
                    <input
                      id={monthInputId}
                      type="text"
                      inputMode="numeric"
                      placeholder="MM"
                      maxLength={2}
                      className={`${inputClass} w-12`}
                      value={month}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        v = validateMonth(v);
                        updateDate(day, v, year);
                        // Auto-jump to year when 2 digits entered
                        if (v.length === 2) {
                          document.getElementById(yearInputId)?.focus();
                        }
                      }}
                    />
                    <span className="text-muted-foreground">/</span>
                    <input
                      id={yearInputId}
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY"
                      maxLength={4}
                      className={`${inputClass} w-16`}
                      value={year}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        updateDate(day, month, v);
                      }}
                    />
                  </div>
                );
              }
              if (field.type === ActionFieldType.SELECT && field.options) {
                const options = field.options.map((opt: string) => ({
                  value: opt,
                  label: opt,
                }));
                return (
                  <Select
                    options={options}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={t("common.select")}
                  />
                );
              }
              return <></>;
            }}
          />
          {errors[field.key] && (
            <span className="text-xs text-red-500">
                {String(errors[field.key]?.message || t("common.required"))}
            </span>
          )}
        </div>
      ))}

      {serverError && <div className="text-sm text-red-500">{serverError}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
          {t("common.submit")}
        </Button>
      </div>
    </form>
  );
};

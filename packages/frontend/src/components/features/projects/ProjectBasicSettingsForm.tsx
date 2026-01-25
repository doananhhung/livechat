import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";
import { Button } from "../../ui/Button";
import { StickyFooter } from "../../ui/StickyFooter";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/use-toast";
import { updateProject } from "../../../services/projectApi";
import type { UpdateProjectDto } from "@live-chat/shared-dtos";
import { type ProjectWithRole } from "@live-chat/shared-types";

interface ProjectBasicSettingsFormProps {
  project: ProjectWithRole;
}

// Regex for FQDN (Fully Qualified Domain Name) validation
// Allows: example.com, sub.example.com, localhost
// Disallows: http://example.com, example.com/path
const domainRegex = /^(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d{1,5})?$/;

export const ProjectBasicSettingsForm = ({
  project,
}: ProjectBasicSettingsFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState(project.name);
  const [autoResolveMinutes, setAutoResolveMinutes] = useState<number | string>(
    project.autoResolveMinutes ?? 0,
  );
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>(
    project.whitelistedDomains || [],
  );

  useEffect(() => {
    setProjectName(project.name);
    setAutoResolveMinutes(project.autoResolveMinutes ?? 0);
    setWhitelistedDomains(project.whitelistedDomains || []);
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectDto) => updateProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: t("common.success"),
        description: t("toast.projectUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("settings.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleAddDomain = () => {
    setWhitelistedDomains([...whitelistedDomains, ""]);
  };

  const handleRemoveDomain = (index: number) => {
    setWhitelistedDomains(whitelistedDomains.filter((_, i) => i !== index));
  };

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...whitelistedDomains];
    newDomains[index] = value;
    setWhitelistedDomains(newDomains);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = projectName.trim();
    if (!trimmedName) {
      toast({
        title: t("common.error"),
        description: t("settings.projectNameRequired"),
        variant: "destructive",
      });
      return;
    }

    const finalDomains = whitelistedDomains
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (finalDomains.length === 0) {
      toast({
        title: t("common.error"),
        description: t("settings.domainRequired"),
        variant: "destructive",
      });
      return;
    }

    // Validate domains format
    const invalidDomains = finalDomains.filter(
      (domain) => !domainRegex.test(domain),
    );

    if (invalidDomains.length > 0) {
      toast({
        title: t("settings.domainFormatError"),
        description: t("settings.invalidDomains", {
          domains: invalidDomains.join(", "),
        }),
        variant: "destructive",
      });
      return;
    }

    const autoResolve = Number(autoResolveMinutes);
    if (isNaN(autoResolve) || autoResolve < 0) {
      toast({
        title: t("common.error"),
        description: t("settings.autoResolvePositive"),
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      name: trimmedName,
      whitelistedDomains: finalDomains,
      autoResolveMinutes: autoResolve,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div>
        <label
          htmlFor="projectName"
          className="block text-sm font-medium text-foreground mb-2"
        >
          {t("settings.projectName")}{" "}
          <span className="text-destructive">*</span>
        </label>
        <Input
          id="projectName"
          type="text"
          placeholder={t("settings.projectNamePlaceholder")}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={updateMutation.isPending}
          required
        />
      </div>

      {/* Auto Resolve Minutes */}
      <div>
        <label
          htmlFor="autoResolveMinutes"
          className="block text-sm font-medium text-foreground mb-2"
        >
          {t("settings.autoResolve")}
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          {t("settings.autoResolveHelp")}
        </p>
        <Input
          id="autoResolveMinutes"
          type="number"
          placeholder="0"
          value={autoResolveMinutes}
          onChange={(e) => setAutoResolveMinutes(e.target.value)}
          disabled={updateMutation.isPending}
        />
      </div>

      {/* Whitelisted Domains */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("settings.whitelistedDomains")}{" "}
          <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          {t("settings.whitelistedDomainsHelp")}
        </p>
        <div className="space-y-2">
          {whitelistedDomains.map((domain, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={t("settings.domainPlaceholder")}
                value={domain}
                onChange={(e) => handleDomainChange(index, e.target.value)}
                disabled={updateMutation.isPending}
                className="flex-1"
              />
              {whitelistedDomains.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveDomain(index)}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={handleAddDomain}
          disabled={updateMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("settings.addDomain")}
        </Button>
      </div>

      {/* Submit Button */}
      <StickyFooter className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </StickyFooter>
    </form>
  );
};

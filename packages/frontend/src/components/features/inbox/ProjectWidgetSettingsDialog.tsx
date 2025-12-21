import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/use-toast";
import { updateProjectSettings } from "../../../services/projectApi";
import type {
  ProjectWithRole,
  IWidgetSettingsDto,
} from "@live-chat/shared-types";
import { WidgetTheme } from "@live-chat/shared-types";

interface ProjectWidgetSettingsDialogProps {
  project: ProjectWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectWidgetSettingsDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectWidgetSettingsDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<Partial<IWidgetSettingsDto>>({
    theme: WidgetTheme.LIGHT,
    headerText: "",
    primaryColor: "#1a73e8",
    welcomeMessage: "",
    position: "bottom-right" as any,
    fontFamily: "sans-serif",
  });

  useEffect(() => {
    if (project.widgetSettings) {
      setSettings({
        theme: project.widgetSettings.theme || WidgetTheme.LIGHT,
        headerText: project.widgetSettings.headerText || "",
        primaryColor: project.widgetSettings.primaryColor || "#1a73e8",
        welcomeMessage: project.widgetSettings.welcomeMessage || "",
        position: project.widgetSettings.position || ("bottom-right" as any),
        companyLogoUrl: project.widgetSettings.companyLogoUrl,
        agentDisplayName: project.widgetSettings.agentDisplayName,
        offlineMessage: project.widgetSettings.offlineMessage,
        autoOpenDelay: project.widgetSettings.autoOpenDelay,
        backgroundImageUrl: project.widgetSettings.backgroundImageUrl,
        backgroundOpacity: project.widgetSettings.backgroundOpacity,
        fontFamily: project.widgetSettings.fontFamily || "sans-serif",
      });
    }
  }, [project]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<IWidgetSettingsDto>) =>
      updateProjectSettings(project.id, data as IWidgetSettingsDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt widget",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cài đặt Widget</DialogTitle>
          <DialogDescription>
            Tùy chỉnh giao diện widget cho dự án {project.name}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-96 overflow-y-auto"
        >
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Giao diện
            </label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              value={settings.theme}
              onChange={(e) =>
                setSettings({ ...settings, theme: e.target.value as WidgetTheme })
              }
            >
              <option value={WidgetTheme.LIGHT}>Sáng</option>
              <option value={WidgetTheme.DARK}>Tối</option>
            </select>
          </div>

          {/* Header Text */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tiêu đề Header
            </label>
            <Input
              type="text"
              placeholder="Nhập tiêu đề..."
              value={settings.headerText}
              onChange={(e) =>
                setSettings({ ...settings, headerText: e.target.value })
              }
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tối đa 50 ký tự
            </p>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Màu chủ đạo
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={settings.primaryColor}
                onChange={(e) =>
                  setSettings({ ...settings, primaryColor: e.target.value })
                }
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={settings.primaryColor}
                onChange={(e) =>
                  setSettings({ ...settings, primaryColor: e.target.value })
                }
                placeholder="#1a73e8"
                className="flex-1"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Font chữ
            </label>
            <Input
              type="text"
              placeholder="sans-serif"
              value={settings.fontFamily}
              onChange={(e) =>
                setSettings({ ...settings, fontFamily: e.target.value })
              }
            />
             <p className="text-xs text-muted-foreground mt-1">
              Sử dụng tên font an toàn cho web (vd: Arial, Verdana, sans-serif)
            </p>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lời chào
            </label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background"
              placeholder="Nhập lời chào..."
              value={settings.welcomeMessage}
              onChange={(e) =>
                setSettings({ ...settings, welcomeMessage: e.target.value })
              }
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tối đa 200 ký tự
            </p>
          </div>

          {/* Widget Position */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Vị trí Widget
            </label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              value={settings.position}
              onChange={(e) =>
                setSettings({ ...settings, position: e.target.value as any })
              }
            >
              <option value="bottom-right">Góc dưới bên phải</option>
              <option value="bottom-left">Góc dưới bên trái</option>
            </select>
          </div>

          {/* Company Logo URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Logo công ty (URL)
            </label>
            <Input
              type="url"
              placeholder="https://example.com/logo.png"
              value={settings.companyLogoUrl || ""}
              onChange={(e) =>
                setSettings({ ...settings, companyLogoUrl: e.target.value })
              }
            />
          </div>

          {/* Agent Display Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tên hiển thị nhân viên
            </label>
            <Input
              type="text"
              placeholder="Nhập tên..."
              value={settings.agentDisplayName || ""}
              onChange={(e) =>
                setSettings({ ...settings, agentDisplayName: e.target.value })
              }
              maxLength={100}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSettingsMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

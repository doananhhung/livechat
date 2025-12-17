import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ui/use-toast";
import { updateProject } from "../../services/projectApi";
import type {
  ProjectWithRole,
  UpdateProjectDto,
} from "@social-commerce/shared";

interface ProjectBasicSettingsFormProps {
  project: ProjectWithRole;
}

export const ProjectBasicSettingsForm = ({
  project,
}: ProjectBasicSettingsFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState(project.name);
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>(
    project.whitelistedDomains || []
  );

  useEffect(() => {
    setProjectName(project.name);
    setWhitelistedDomains(project.whitelistedDomains || []);
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectDto) => updateProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin dự án",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin",
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
        title: "Lỗi",
        description: "Tên dự án không được để trống",
        variant: "destructive",
      });
      return;
    }

    const finalDomains = whitelistedDomains
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (finalDomains.length === 0) {
      toast({
        title: "Lỗi",
        description: "Phải có ít nhất một tên miền",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      name: trimmedName,
      whitelistedDomains: finalDomains,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tên dự án <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          placeholder="Nhập tên dự án..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={updateMutation.isPending}
          required
        />
      </div>

      {/* Whitelisted Domains */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Danh sách tên miền được phép{" "}
          <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Chỉ các trang web từ các tên miền này mới có thể sử dụng widget
        </p>
        <div className="space-y-2">
          {whitelistedDomains.map((domain, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="example.com (không cần https://)"
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
          Thêm tên miền
        </Button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
};

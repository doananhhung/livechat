import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/use-toast";
import { UserPlus, Settings } from "lucide-react";
import { PermissionGate } from "../../components/PermissionGate";
import { ProjectRole } from "@social-commerce/shared";

export const ProjectsListPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState("");
  const [whitelistedDomains, setWhitelistedDomains] = useState([""]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const createProjectMutation = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewProjectName("");
      setWhitelistedDomains([""]);
      toast({ title: "Thành công", description: "Đã tạo dự án mới" });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể tạo dự án";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...whitelistedDomains];
    newDomains[index] = value;
    setWhitelistedDomains(newDomains);
  };

  const addDomainInput = () => {
    setWhitelistedDomains([...whitelistedDomains, ""]);
  };

  const removeDomainInput = (index: number) => {
    const newDomains = whitelistedDomains.filter((_, i) => i !== index);
    setWhitelistedDomains(newDomains);
  };

  const handleCreateProject = () => {
    const trimmedName = newProjectName.trim();
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

    createProjectMutation.mutate({
      name: trimmedName,
      whitelistedDomains: finalDomains,
    });
  };

  const getWidgetSnippet = (projectId: number) => {
    return `<script
  id="your-app-widget-script"
  src="https://cdn.yourdomain.com/widget.js"
  data-project-id="${projectId}"
  async
  defer
></script>`;
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Quản lý các dự án của bạn
      </h1>

      <div className="bg-card text-card-foreground border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Tạo dự án mới</h2>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Nhập tên cho dự án mới"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            disabled={createProjectMutation.isPending}
            className="max-w-md"
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Danh sách tên miền của các trang web bạn muốn tích hợp dự án vào
            </label>
            <div className="space-y-2">
              {whitelistedDomains.map((domain, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="ten-mien-cua-ban.com ✅  https://ten-mien-cua-ban.com ❌"
                    value={domain}
                    onChange={(e) => handleDomainChange(index, e.target.value)}
                    disabled={createProjectMutation.isPending}
                    className="flex-grow"
                  />
                  {whitelistedDomains.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDomainInput(index)}
                      disabled={createProjectMutation.isPending}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addDomainInput}
              disabled={createProjectMutation.isPending}
            >
              Thêm tên miền khác
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <Button
            onClick={handleCreateProject}
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending
              ? "Đang tạo dự án..."
              : "Tạo dự án"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          Danh sách dự án
        </h2>
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-card text-card-foreground border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}/settings`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Cài đặt
                  </Button>
                  <PermissionGate
                    projectId={project.id}
                    requiredRole={ProjectRole.MANAGER}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/projects/${project.id}/invite`)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Mời thành viên
                    </Button>
                  </PermissionGate>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Mã nhúng Widget
                </label>
                <pre className="bg-muted text-muted-foreground p-4 rounded-md text-sm overflow-x-auto">
                  <code>{getWidgetSnippet(project.id)}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(getWidgetSnippet(project.id));
                    toast({
                      title: "Đã copy",
                      description: "Mã nhúng đã được copy vào clipboard",
                    });
                  }}
                >
                  Copy Snippet
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Bạn chưa có dự án nào. Tạo dự án đầu tiên để bắt đầu!
          </p>
        )}
      </div>
    </div>
  );
};

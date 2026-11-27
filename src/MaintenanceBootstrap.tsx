import { useEffect, useState, type ReactNode } from "react";
import type { MaintenanceConfig } from "./maintenance";
import { fetchMaintenanceConfig } from "./maintenanceBootstrap";

type Props = {
  children: (config: MaintenanceConfig) => ReactNode;
};

/**
 * Renders the app shell immediately and loads optional maintenance settings
 * in the background. Network latency must never delay local safety controls.
 */
export default function MaintenanceBootstrap({ children }: Props) {
  const [config, setConfig] = useState<MaintenanceConfig>({});

  useEffect(() => {
    let active = true;
    void fetchMaintenanceConfig(
      fetch,
      `${import.meta.env.BASE_URL}maintenance.json`,
    ).then((nextConfig) => {
      if (active) setConfig(nextConfig);
    });

    return () => {
      active = false;
    };
  }, []);

  return <>{children(config)}</>;
}

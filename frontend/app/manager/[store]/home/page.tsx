"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import Icon from "../../../../components/AppIcon";
import { useAuth } from "../../../../contexts/AuthContext";
import { MerchantDashboard } from "../../../../lib/api";
import Loader from "../../../../components/Loader";
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button as MUIButton,
  Chip,
  Divider,
  Grid,
} from "@mui/material";

type Stat = {
  label: string;
  value: string | number;
  delta?: string;
};

function LineChart({
  data,
  xLabels,
  height = 260,
  stroke = "#0ea5e9",
}: {
  data: number[];
  xLabels?: string[];
  height?: number;
  stroke?: string;
}) {
  const width = 980;
  const paddingLeft = 48; // space for Y-axis labels
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 36; // space for X-axis labels
  const innerW = width - paddingLeft - paddingRight;
  const innerH = height - paddingTop - paddingBottom;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = innerW / (data.length - 1);
  const points = data.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + innerH - ((d - min) / range) * innerH;
    return `${x},${y}`;
  });
  const path = `M ${points.join(" L ")}`;

  // grid lines
  const yTicks = 5;
  const yTickValues = Array.from(
    { length: yTicks + 1 },
    (_, i) => min + (i * range) / yTicks
  );

  const verticalEvery = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
      <defs>
        <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Axes */}
      <line
        x1={paddingLeft}
        y1={paddingTop + innerH}
        x2={paddingLeft + innerW}
        y2={paddingTop + innerH}
        stroke="#cbd5e1"
      />
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={paddingTop + innerH}
        stroke="#cbd5e1"
      />

      {/* Horizontal grid + Y labels */}
      {yTickValues.map((v, idx) => {
        const y = paddingTop + innerH - ((v - min) / range) * innerH;
        return (
          <g key={`y-${idx}`}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + innerW}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              {v.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Vertical grid + X labels */}
      {data.map((_, i) => {
        const x = paddingLeft + i * stepX;
        const show = i % verticalEvery === 0 || i === data.length - 1;
        return (
          <g key={`x-${i}`}>
            {show && (
              <>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + innerH}
                  stroke="#f1f5f9"
                />
                <text
                  x={x}
                  y={paddingTop + innerH + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                >
                  {(xLabels && xLabels[i]) || ""}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Line and area */}
      <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
      <path d={path} fill="url(#fill)" stroke="none" />
    </svg>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {stat.label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
          {stat.value}
        </Typography>
        {stat.delta && (
          <Typography
            variant="caption"
            color="success.main"
            sx={{
              mt: 0.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Icon name="TrendingUp" size={14} /> {stat.delta}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function QuickCard({
  href,
  icon,
  title,
  subtitle,
  count,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle?: string;
  count?: number | string;
}) {
  return (
    <Link href={href} className="block">
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          transition: "box-shadow .2s ease",
          "&:hover": { boxShadow: "0 6px 18px rgba(2,6,23,.06)" },
        }}
      >
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div className="h-12 w-12 rounded-lg bg-sky-50 text-sky-600 grid place-items-center">
            <Icon name={icon} size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Typography fontWeight={600}>{title}</Typography>
              {typeof count !== "undefined" && (
                <Typography variant="caption" color="text.secondary">
                  ({count})
                </Typography>
              )}
            </div>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </div>
          <Icon name="ChevronRight" className="text-slate-400" size={18} />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function page() {
  const { user, userStore, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && userStore) {
      setLoading(true);
      MerchantDashboard.getStats(userStore._id || userStore.id)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          console.error("Failed to fetch dashboard stats:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userStore, authLoading]);

  if (authLoading || loading) {
    return <Loader />;
  }

  const stats = data?.stats || [];
  const salesData = data?.sales_data || [];
  const counts = data?.counts || {};

  return (
    <ManagerLayout title="Dashboard | Overview">
      <div className="space-y-6">
        {/* KPI Cards - consistent compact spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {stats.map((s: any) => (
            <div key={s.label}>
              <StatCard stat={s} />
            </div>
          ))}
        </div>

        {/* Sales line chart */}
        <Card
          elevation={0}
          sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}
        >
          <CardContent>
            <Typography fontWeight={600}>Gross Sales</Typography>
            <div className="mt-2">
              {(() => {
                const now = new Date();
                const labels = Array.from(
                  { length: salesData.length },
                  (_, i) => {
                    const d = new Date(now);
                    d.setDate(d.getDate() - (salesData.length - 1 - i));
                    return d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "2-digit",
                    });
                  }
                );
                return <LineChart data={salesData} xLabels={labels} />;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Advanced analytics row */}
        <Grid container spacing={2} alignItems="stretch">
          {/* Yearly Sales */}
          <Grid component="div" xs={12} lg={8} sx={{ display: "flex" }}>
            <Card
              elevation={0}
              sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}
            >
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography fontWeight={700}>Yearly sales</Typography>
                    <Typography variant="caption" color="success.main">
                      (+43%) than last year
                    </Typography>
                  </div>
                  <Chip
                    size="small"
                    label={new Date().getFullYear()}
                    variant="outlined"
                  />
                </div>

                {(() => {
                  const months = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ];
                  const income = [
                    50, 35, 25, 20, 90, 80, 60, 150, 95, 70, 60, 55,
                  ];
                  const expenses = [
                    45, 30, 22, 18, 70, 95, 75, 40, 65, 80, 75, 70,
                  ];

                  const DualLine = () => {
                    const width = 980;
                    const height = 280;
                    const paddingLeft = 48;
                    const paddingRight = 16;
                    const paddingTop = 20;
                    const paddingBottom = 32;
                    const innerW = width - paddingLeft - paddingRight;
                    const innerH = height - paddingTop - paddingBottom;
                    const max = Math.max(...income, ...expenses);
                    const min = 0;
                    const range = max - min || 1;
                    const stepX = innerW / (months.length - 1);
                    const mapY = (v: number) =>
                      paddingTop + innerH - ((v - min) / range) * innerH;
                    const pts = (arr: number[]) =>
                      arr
                        .map((v, i) => `${paddingLeft + i * stepX},${mapY(v)}`)
                        .join(" L ");

                    return (
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-[280px] mt-2"
                      >
                        {/* grid */}
                        {[0, 1, 2, 3, 4, 5].map((i) => {
                          const y = paddingTop + (innerH / 5) * i;
                          return (
                            <line
                              key={i}
                              x1={paddingLeft}
                              x2={paddingLeft + innerW}
                              y1={y}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeDasharray="4 4"
                            />
                          );
                        })}
                        {/* x labels */}
                        {months.map((m, i) => (
                          <text
                            key={m}
                            x={paddingLeft + i * stepX}
                            y={paddingTop + innerH + 18}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#64748b"
                          >
                            {m}
                          </text>
                        ))}
                        {/* income */}
                        <defs>
                          <linearGradient
                            id="income"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#10b981"
                              stopOpacity="0.18"
                            />
                            <stop
                              offset="100%"
                              stopColor="#10b981"
                              stopOpacity="0"
                            />
                          </linearGradient>
                          <linearGradient
                            id="expenses"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f59e0b"
                              stopOpacity="0.18"
                            />
                            <stop
                              offset="100%"
                              stopColor="#f59e0b"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M ${pts(income)}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                        <path
                          d={`M ${pts(expenses)}`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                        />
                        {/* soft area fill from income to baseline */}
                        <path
                          d={`M ${pts(income)} L ${paddingLeft + innerW},${paddingTop + innerH
                            } L ${paddingLeft},${paddingTop + innerH} Z`}
                          fill="url(#income)"
                        />
                        <path
                          d={`M ${pts(expenses)} L ${paddingLeft + innerW},${paddingTop + innerH
                            } L ${paddingLeft},${paddingTop + innerH} Z`}
                          fill="url(#expenses)"
                        />
                      </svg>
                    );
                  };

                  return (
                    <div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                          Total income
                          <strong className="ml-2">1.23k</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />{" "}
                          Total expenses
                          <strong className="ml-2">6.79k</strong>
                        </div>
                      </div>
                      <DualLine />
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </Grid>

          {/* Sales overview + balance */}
          <Grid xs={12} lg={4} sx={{ width: { lg: 360 }, ml: { lg: "auto" } }}>
            <Card
              elevation={0}
              sx={{ borderRadius: 2, border: "1px solid #e2e8f0", mb: 2 }}
            >
              <CardContent>
                <Typography fontWeight={700}>Sales overview</Typography>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total profit</span>
                      <span className="text-slate-500">$8,374 (10.1%)</span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={10.1}
                      color="success"
                      sx={{ height: 8, borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total income</span>
                      <span className="text-slate-500">$9,714 (13.6%)</span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={13.6}
                      color="info"
                      sx={{ height: 8, borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total expenses</span>
                      <span className="text-slate-500">$6,871 (28.2%)</span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={28.2}
                      color="warning"
                      sx={{ height: 8, borderRadius: 6 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}
            >
              <CardContent>
                <Typography color="text.secondary">Current balance</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  $187,650
                </Typography>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order total</span>
                    <span className="text-slate-600">$287,650</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Earning</span>
                    <span className="text-slate-600">$25,500</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Refunded</span>
                    <span className="text-slate-600">$1,600</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <MUIButton
                    variant="contained"
                    color="warning"
                    disableElevation
                  >
                    Request
                  </MUIButton>
                  <MUIButton
                    variant="contained"
                    color="success"
                    disableElevation
                  >
                    Transfer
                  </MUIButton>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard href="../clients" icon="Users" title="Clients" count={counts.customers || 0} />
          <QuickCard
            href="../intresteredClients"
            icon="UserPlus"
            title="Interested Clients"
            subtitle="No interested clients yet"
          />
          <QuickCard
            href="../products"
            icon="Package"
            title="Products"
            count={counts.products || 0}
          />
          <QuickCard href="../brands" icon="Tags" title="Brands" count={counts.brands || 0} />
          <QuickCard
            href="../categories"
            icon="Layers"
            title="Categories"
            count={counts.categories || 0}
          />
          <QuickCard href="../notice" icon="Bell" title="Notices" count={counts.notices || 0} />
          <QuickCard
            href="../orders"
            icon="Clock"
            title="Orders"
            count={counts.orders || 0}
          />
          <QuickCard
            href="../reports"
            icon="MessageSquare"
            title="Queries"
            subtitle="No pending queries yet"
          />
          <QuickCard
            href="../enquiry"
            icon="MessageSquare"
            title="Enquiries"
            subtitle="No pending enquiries"
          />
          <QuickCard
            href="../reviews"
            icon="Star"
            title="Ratings"
            subtitle="No pending ratings"
          />
          <QuickCard
            href="../reports"
            icon="IndianRupee"
            title="Total Sales"
            count={counts.orders || 0}
          />
          <QuickCard href="../reports" icon="BarChart3" title="Reports" />
        </div>

        {/* Recent Orders & Latest products */}
        <Grid container spacing={2}>
          <Grid xs={12} lg={6}>
            <Card
              elevation={0}
              sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}
            >
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Typography fontWeight={700}>Recent orders</Typography>
                  <Link href="../orders" className="text-xs text-primary hover:underline">View all</Link>
                </div>
                <div className="space-y-4">
                  {(data?.recent_orders || []).map((o, i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Icon name="User" size={18} className="text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{o.customer}</div>
                          <div className="text-[10px] text-slate-500">{o.date && new Date(o.date).toLocaleDateString()} • {o.id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">₹{o.amount}</div>
                        <div className={`text-[10px] uppercase font-semibold ${o.status === 'completed' ? 'text-emerald-600' :
                            o.status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                          }`}>{o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} lg={6}>
            <Card
              elevation={0}
              sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}
            >
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Typography fontWeight={700}>Latest products</Typography>
                  <Link href="../products" className="text-xs text-primary hover:underline">View all</Link>
                </div>
                <div className="space-y-4">
                  {(data?.latest_products || []).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-12 w-12 rounded-lg object-cover bg-slate-100" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100 grid place-items-center">
                          <Icon name="Package" size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-slate-600">{p.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </ManagerLayout>
  );
}

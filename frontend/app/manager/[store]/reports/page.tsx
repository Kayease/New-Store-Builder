"use client";
import React from "react";
import ManagerLayout from "../../../../components/manager/ManagerLayout";
import {
  Typography,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import ClientsImage from "../../../../public/report/clients.jpg";
import ProductsImage from "../../../../public/report/products.jpg";
import OrdersImage from "../../../../public/report/orders.jpg";
import ReportsImage from "../../../../public/report/sales-report.jpg";

function InteractiveLine({
  data,
  xLabels,
  color = "#0ea5e9",
}: {
  data: number[];
  xLabels: string[];
  color?: string;
}) {
  const width = 980;
  const height = 260;
  const left = 48;
  const bottom = 32;
  const right = 12;
  const top = 16;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = innerW / (data.length - 1);
  const mapY = (v: number) => top + innerH - ((v - min) / range) * innerH;
  const points = data.map((v, i) => [left + i * stepX, mapY(v)] as const);
  const path = points.reduce(
    (acc, [x, y], i) => (i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`),
    ""
  );
  const [hover, setHover] = React.useState<number | null>(null);
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const bounds = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const relX = e.clientX - bounds.left;
    const i = Math.round((relX - left) / stepX);
    if (i >= 0 && i < data.length) setHover(i);
    else setHover(null);
  };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[260px]"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <line x1={left} y1={top} x2={left} y2={top + innerH} stroke="#cbd5e1" />
      <line
        x1={left}
        y1={top + innerH}
        x2={left + innerW}
        y2={top + innerH}
        stroke="#cbd5e1"
      />
      {[0, 1, 2, 3, 4].map((i) => {
        const y = top + (innerH / 4) * i;
        const v = (max - (range / 4) * i).toFixed(0);
        return (
          <g key={`g-${i}`}>
            <line
              x1={left}
              y1={y}
              x2={left + innerW}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              {v}
            </text>
          </g>
        );
      })}
      {xLabels.map((m, i) => (
        <text
          key={m}
          x={left + i * stepX}
          y={top + innerH + 16}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
        >
          {m}
        </text>
      ))}
      <path d={path} stroke={color} strokeWidth={2.5} fill="none" />
      {hover !== null && (
        <g>
          <line
            x1={points[hover][0]}
            y1={top}
            x2={points[hover][0]}
            y2={top + innerH}
            stroke="#94a3b8"
            strokeDasharray="4 4"
          />
          <circle
            cx={points[hover][0]}
            cy={points[hover][1]}
            r={4}
            fill={color}
          />
          <rect
            x={Math.min(points[hover][0] + 8, left + innerW - 110)}
            y={top + 8}
            rx={6}
            ry={6}
            width={110}
            height={44}
            fill="#0f172a"
            opacity={0.9}
          />
          <text
            x={Math.min(points[hover][0] + 16, left + innerW - 100)}
            y={top + 28}
            fontSize="11"
            fill="#fff"
          >{`Value: ${data[hover]}`}</text>
          <text
            x={Math.min(points[hover][0] + 16, left + innerW - 100)}
            y={top + 44}
            fontSize="10"
            fill="#cbd5e1"
          >
            {xLabels[hover]}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function page() {
  const sales = [
    68, 72, 69, 75, 80, 78, 84, 90, 96, 94, 100, 102, 98, 105, 110, 112,
  ];
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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
  ].slice(0, sales.length);
  return (
    <>
      <ManagerLayout title="Reports">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Chip label="Gross sale" color="primary" variant="outlined" />
              <Chip label="Net sale" variant="outlined" />
              <Chip label="Refunded" variant="outlined" />
            </div>
            <Select
              size="small"
              defaultValue="30d"
              sx={{ background: "white" }}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="ytd">YTD</MenuItem>
            </Select>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { t: "Gross Sale", v: "98.88" },
              { t: "Net Sale", v: "98.88" },
              { t: "Refunded Orders", v: 0 },
              { t: "Cancelled Orders", v: 0 },
              { t: "My Orders", v: 3 },
            ].map((x) => (
              <Card
                key={x.t}
                elevation={0}
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
              >
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {x.t}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {x.v}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gross sales line */}
          <Card
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <CardContent>
              <Typography fontWeight={700}>Gross Sales</Typography>
              <InteractiveLine data={sales} xLabels={months} />
            </CardContent>
          </Card>

          {/* Quick report tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { t: "Clients", i: "Users", image: ClientsImage },
              { t: "Products", i: "Package", image: ProductsImage },
              { t: "My Orders", i: "ClipboardList", image: OrdersImage },
              { t: "Sales Report", i: "BarChart3", image: ReportsImage },
            ].map((k) => (
              <Card
                key={k.t}
                elevation={0}
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
              >
                <CardContent>
                  <div className="flex items-center justify-between flex-col gap-8">
                    <div className="flex items-center flex-col gap-3">
                      <div className="h-62 w-62 rounded-lg bg-slate-100 grid place-items-center">
                        <img
                          src={
                            typeof k.image === "string" ? k.image : k.image.src
                          }
                          alt={k.t}
                          className="w-56 h-56 object-contain"
                        />
                      </div>
                      <div>
                        <Typography fontWeight={700}>{k.t}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          View and export {k.t.toLowerCase()}
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-14 h-14 flex items-center justify-center rounded border border-green-500 hover:bg-green-50 transition"
                        style={{ padding: 0 }}
                        title="Export as Spreadsheet"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 48 48"
                        >
                          <path
                            fill="#169154"
                            d="M29,6H15.744C14.781,6,14,6.781,14,7.744v7.259h15V6z"
                          ></path>
                          <path
                            fill="#18482a"
                            d="M14,33.054v7.202C14,41.219,14.781,42,15.743,42H29v-8.946H14z"
                          ></path>
                          <path
                            fill="#0c8045"
                            d="M14 15.003H29V24.005000000000003H14z"
                          ></path>
                          <path
                            fill="#17472a"
                            d="M14 24.005H29V33.055H14z"
                          ></path>
                          <g>
                            <path
                              fill="#29c27f"
                              d="M42.256,6H29v9.003h15V7.744C44,6.781,43.219,6,42.256,6z"
                            ></path>
                            <path
                              fill="#27663f"
                              d="M29,33.054V42h13.257C43.219,42,44,41.219,44,40.257v-7.202H29z"
                            ></path>
                            <path
                              fill="#19ac65"
                              d="M29 15.003H44V24.005000000000003H29z"
                            ></path>
                            <path
                              fill="#129652"
                              d="M29 24.005H44V33.055H29z"
                            ></path>
                          </g>
                          <path
                            fill="#0c7238"
                            d="M22.319,34H5.681C4.753,34,4,33.247,4,32.319V15.681C4,14.753,4.753,14,5.681,14h16.638 C23.247,14,24,14.753,24,15.681v16.638C24,33.247,23.247,34,22.319,34z"
                          ></path>
                          <path
                            fill="#fff"
                            d="M9.807 19L12.193 19 14.129 22.754 16.175 19 18.404 19 15.333 24 18.474 29 16.123 29 14.013 25.07 11.912 29 9.526 29 12.719 23.982z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="w-14 h-14 flex items-center justify-center rounded border border-green-500 hover:bg-green-50 transition"
                        style={{ padding: 0 }}
                        title="Export as CSV"
                      >
                        <svg
                          height="800px"
                          width="800px"
                          version="1.1"
                          id="Layer_1"
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <path
                            fill="#ECEDEF"
                            d="M100.641,0c-14.139,0-25.6,11.461-25.6,25.6v460.8c0,14.139,11.461,25.6,25.6,25.6h375.467
	c14.139,0,25.6-11.461,25.6-25.6V85.333L416.375,0H100.641z"
                          />
                          <path
                            fill="#D9DCDF"
                            d="M441.975,85.333h59.733L416.375,0v59.733C416.375,73.872,427.836,85.333,441.975,85.333z"
                          />
                          <path
                            fill="#C6CACF"
                            d="M399.308,42.667H75.041v153.6h324.267c4.713,0,8.533-3.821,8.533-8.533V51.2
	C407.841,46.487,404.02,42.667,399.308,42.667z"
                          />
                          <path
                            fill="#C4DF64"
                            d="M382.241,179.2H18.843c-7.602,0-11.41-9.191-6.034-14.567L75.041,102.4L12.809,40.167
	C7.433,34.791,11.241,25.6,18.843,25.6h363.398c4.713,0,8.533,3.821,8.533,8.533v136.533
	C390.775,175.379,386.954,179.2,382.241,179.2z"
                          />
                          <path
                            fill="#C6CACF"
                            d="M399.308,460.8H177.441c-4.713,0-8.533-3.821-8.533-8.533V230.4c0-4.713,3.821-8.533,8.533-8.533
	h221.867c4.713,0,8.533,3.821,8.533,8.533v221.867C407.841,456.979,404.02,460.8,399.308,460.8z"
                          />
                          <path
                            fill="#B3B9BF"
                            d="M185.975,443.733V221.867h-8.533c-4.713,0-8.533,3.821-8.533,8.533v221.867
	c0,4.713,3.821,8.533,8.533,8.533h221.867c4.713,0,8.533-3.821,8.533-8.533v-8.533H185.975z"
                          />
                          <g>
                            <path
                              fill="#FFFFFF"
                              d="M185.975,145.067h-25.6c-4.713,0-8.533-3.821-8.533-8.533v-51.2c0-4.713,3.821-8.533,8.533-8.533
		h25.6c4.713,0,8.533,3.821,8.533,8.533s-3.821,8.533-8.533,8.533h-17.067V128h17.067c4.713,0,8.533,3.821,8.533,8.533
		S190.687,145.067,185.975,145.067z"
                            />
                            <path
                              fill="#FFFFFF"
                              d="M237.175,145.067h-25.6c-4.713,0-8.533-3.821-8.533-8.533s3.821-8.533,8.533-8.533h17.067v-8.533
		h-17.067c-4.713,0-8.533-3.821-8.533-8.533v-25.6c0-4.713,3.821-8.533,8.533-8.533h25.6c4.713,0,8.533,3.821,8.533,8.533
		s-3.821,8.533-8.533,8.533h-17.067v8.533h17.067c4.713,0,8.533,3.821,8.533,8.533v25.6
		C245.708,141.246,241.887,145.067,237.175,145.067z"
                            />
                            <path
                              fill="#FFFFFF"
                              d="M279.841,145.067c-3.673,0-6.934-2.351-8.096-5.835l-17.067-51.2
		c-1.489-4.47,0.926-9.303,5.397-10.794c4.477-1.492,9.303,0.926,10.795,5.397l8.971,26.913l8.971-26.913
		c1.491-4.47,6.322-6.886,10.795-5.397c4.47,1.49,6.886,6.323,5.397,10.794l-17.067,51.2
		C286.776,142.716,283.515,145.067,279.841,145.067z"
                            />
                          </g>
                          <g>
                            <path
                              fill="#8E959F"
                              d="M237.175,273.067h-34.133c-4.713,0-8.533-3.821-8.533-8.533c0-4.713,3.821-8.533,8.533-8.533h34.133
		c4.713,0,8.533,3.821,8.533,8.533C245.708,269.246,241.887,273.067,237.175,273.067z"
                            />
                            <path
                              fill="#8E959F"
                              d="M373.708,273.067h-102.4c-4.713,0-8.533-3.821-8.533-8.533c0-4.713,3.821-8.533,8.533-8.533h102.4
		c4.713,0,8.533,3.821,8.533,8.533C382.241,269.246,378.42,273.067,373.708,273.067z"
                            />
                            <path
                              fill="#8E959F"
                              d="M237.175,324.267h-34.133c-4.713,0-8.533-3.821-8.533-8.533c0-4.713,3.821-8.533,8.533-8.533h34.133
		c4.713,0,8.533,3.821,8.533,8.533C245.708,320.446,241.887,324.267,237.175,324.267z"
                            />
                            <path
                              fill="#8E959F"
                              d="M373.708,324.267h-102.4c-4.713,0-8.533-3.821-8.533-8.533c0-4.713,3.821-8.533,8.533-8.533h102.4
		c4.713,0,8.533,3.821,8.533,8.533C382.241,320.446,378.42,324.267,373.708,324.267z"
                            />
                            <path
                              fill="#8E959F"
                              d="M237.175,375.467h-34.133c-4.713,0-8.533-3.821-8.533-8.533s3.821-8.533,8.533-8.533h34.133
		c4.713,0,8.533,3.821,8.533,8.533S241.887,375.467,237.175,375.467z"
                            />
                            <path
                              fill="#8E959F"
                              d="M296.908,375.467h-25.6c-4.713,0-8.533-3.821-8.533-8.533s3.821-8.533,8.533-8.533h25.6
		c4.713,0,8.533,3.821,8.533,8.533S301.62,375.467,296.908,375.467z"
                            />
                            <path
                              fill="#8E959F"
                              d="M237.175,426.667h-34.133c-4.713,0-8.533-3.821-8.533-8.533s3.821-8.533,8.533-8.533h34.133
		c4.713,0,8.533,3.821,8.533,8.533S241.887,426.667,237.175,426.667z"
                            />
                            <path
                              fill="#8E959F"
                              d="M296.908,426.667h-25.6c-4.713,0-8.533-3.821-8.533-8.533s3.821-8.533,8.533-8.533h25.6
		c4.713,0,8.533,3.821,8.533,8.533S301.62,426.667,296.908,426.667z"
                            />
                          </g>
                          <path
                            fill="#529E44"
                            d="M363.483,392.533l16.781-20.137c3.018-3.621,2.528-9.002-1.092-12.019
	c-3.619-3.017-9.001-2.529-12.018,1.092l-14.778,17.733l-14.778-17.733c-3.017-3.619-8.398-4.109-12.018-1.092
	c-3.621,3.018-4.111,8.398-1.092,12.019l16.78,20.137l-16.781,20.137c-2.754,3.305-2.574,8.309,0.425,11.399
	c3.484,3.59,9.485,3.368,12.686-0.474l14.778-17.733l14.778,17.733c3.201,3.842,9.202,4.063,12.686,0.474
	c2.998-3.09,3.179-8.095,0.425-11.399L363.483,392.533z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ManagerLayout>
    </>
  );
}

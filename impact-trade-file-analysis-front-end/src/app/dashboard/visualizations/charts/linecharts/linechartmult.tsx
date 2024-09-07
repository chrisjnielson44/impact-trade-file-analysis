"use client"

import { useState } from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

import {Button} from "@headlessui/react";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import * as React from "react";

// Generate random profit and loss data for each day of a month
const generateRandomData = (days: number) => {
    const data = []
    for (let i = 1; i <= days; i++) {
        data.push({
            day: `${i}`,
            E1: Math.floor(Math.random() * 1000) - 500, // Random profit/loss between -500 and 500
            E2: Math.floor(Math.random() * 1000) - 500, // Random profit/loss between -500 and 500
        })
    }
    return data
}

const chartConfig = {
    E1: {
        label: "E1: ",
        color: "hsl(var(--chart-1))",
    },
    E2: {
        label: "E2: ",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

export function LineChartMultComponent() {
    const [selectedRange, setSelectedRange] = useState("1Y")
    const [chartData, setChartData] = useState(generateRandomData(30))

    const handleDateRangeChange = (range: string) => {
        setSelectedRange(range)
        let days
        switch (range) {
            case "5D":
                days = 5
                break
            case "1M":
                days = 30
                break
            case "3M":
                days = 90
                break
            case "1Y":
            default:
                days = 365
                break
        }
        setChartData(generateRandomData(days))
    }

    return (
        <Card>
            <CardHeader className="flex">
                <div className="flex">
                    <CardTitle>Profit/Loss</CardTitle>
                    <div className="ml-auto">
                        <Select>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="5d">5D</SelectItem>
                                    <SelectItem value="1m">1M</SelectItem>
                                    <SelectItem value="3m">3M</SelectItem>
                                    <SelectItem value="6m">6M</SelectItem>
                                    <SelectItem value="1y">1Y</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] h-[700px] w-full">
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Line
                            dataKey="E1"
                            type="monotone"
                            stroke="var(--color-E1)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="E2"
                            type="monotone"
                            stroke="var(--color-E2)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
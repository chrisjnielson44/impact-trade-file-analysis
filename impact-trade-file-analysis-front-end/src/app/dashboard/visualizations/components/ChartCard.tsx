'use client';
import React, { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { SelectMetric } from "@/app/dashboard/visualizations/components/selectors/SelectMetric"
import { SelectProduct } from "@/app/dashboard/visualizations/components/selectors/SelectProduct"

import { PFEChartComponent } from "@/app/dashboard/visualizations/charts/linecharts/linechartmult"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ChartCard() {
    const [engine, setEngine] = useState("f22")
    const [product, setProduct] = useState("fxforward")
    const [metric, setMetric] = useState("pfe-standalone")
    const [chartType, setChartType] = useState("1m")

    return (
        <Card className="w-full h-[4/5]">
            <CardHeader>
                <div className="flex">
                    <div className="flex space-x-2 py-1">
                        <SelectProduct value={product} onValueChange={setProduct} />
                        <SelectMetric value={metric} onValueChange={setMetric} />
                    </div>
                    <div className="ml-auto flex space-x-2">
                        <Select value={chartType} onValueChange={setChartType}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Chart Type" />
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
                        <Button variant="outline">
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <PFEChartComponent
                    product={product}
                    metric={metric}
                    chartType={chartType}
                />
            </CardContent>
            <CardFooter>
            </CardFooter>
        </Card>
    )
}
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import {SelectEngine} from "@/app/dashboard/components/selectors/SelectEngine";
import {SelectMetric} from "@/app/dashboard/components/selectors/SelectMetric";
import {SelectProduct} from "@/app/dashboard/components/selectors/SelectProduct";

import {LineChartMultComponent} from "@/app/dashboard/visualizations/charts/linecharts/linechartmult"
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import * as React from "react";

export function ChartCard() {
    return (
        <Card className="w-full h-[4/5]">
            <CardHeader>
                <div className="flex">
                    <div className="flex space-x-2 py-1">
                        <SelectEngine/>
                        <SelectProduct/>
                        <SelectMetric/>
                    </div>
                    <div className="ml-auto flex space-x-2">
                    <Select>
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
                <LineChartMultComponent/>
            </CardContent>
            <CardFooter>

            </CardFooter>
        </Card>
    )
}
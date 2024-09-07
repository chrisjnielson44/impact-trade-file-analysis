import * as React from "react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function SelectEngine() {
    return (
        <Select>
            <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select Engine" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="f22">F22</SelectItem>
                    <SelectItem value="quic">QUIC</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

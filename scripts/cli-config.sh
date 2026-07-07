#!/bin/bash

# 21st.dev custom registry setup
export REGISTRY="https://ui.shadcn.com/r/${branch}/${name}.json"

# Component registration function
function register_component() {
    local component_id=$1
    local description=$2
    echo "Registering component $component_id..."
    # Add custom registration logic here
    echo "Component $component_id registered successfully"
}

# Main execution
if [[ $# -eq 2 ]]; then
    register_component "$1"" $2"
fi "$2"
fi
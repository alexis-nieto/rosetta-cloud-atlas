import csv
import yaml
import re

# Mapping CSV headers to YAML keys
provider_map = {
    'AWS': 'aws',
    'Azure': 'azure',
    'Google Cloud': 'gcp',
    'Oracle Cloud (OCI)': 'oracle',
    'Alibaba Cloud': 'alibaba',
    'Tencent Cloud': 'tencent',
    'IBM Cloud': 'ibm'
}

def to_slug(text):
    return text.lower().replace(' & ', '-').replace(' ', '-')

hierarchy = []

with open('data.csv', 'r') as f:
    reader = csv.DictReader(f)
    
    current_tier = None
    current_domain = None
    
    for row in reader:
        tier_name = row['Tier'].strip()
        domain_name = row['Domain'].strip()
        category_name = row['Category'].strip()
        
        # Find or create Tier
        tier = next((t for t in hierarchy if t['name'] == tier_name), None)
        if not tier:
            tier = {
                'id': to_slug(tier_name),
                'name': tier_name,
                'domains': []
            }
            hierarchy.append(tier)
            
        # Find or create Domain
        domain = next((d for d in tier['domains'] if d['name'] == domain_name), None)
        if not domain:
            domain = {
                'id': to_slug(domain_name),
                'name': domain_name,
                'categories': []
            }
            tier['domains'].append(domain)
            
        # Create Category
        services = {}
        for csv_header, yaml_key in provider_map.items():
            if row[csv_header].strip():
                services[yaml_key] = row[csv_header].strip()
                
        category = {
            'id': to_slug(category_name),
            'name': category_name,
            'services': services
        }
        domain['categories'].append(category)

with open('data.yaml', 'w') as f:
    yaml.dump(hierarchy, f, sort_keys=False, default_flow_style=False, allow_unicode=True)

print("Conversion complete.")

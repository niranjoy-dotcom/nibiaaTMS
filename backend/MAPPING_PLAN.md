# Zoho Billing Plan to Thingsboard Profile Mapping Plan

## Current Status

### Available Zoho Plans
| Plan Name | Plan Code |
|-----------|-----------|
| test | T_001 |
| Enterprise Plan | ENT-YEARLY |
| Basic | ETS-BAS-01 |
| Standard | WMS-STD-01 |

### Available Thingsboard Profiles
| Profile Name | ID | Default |
|--------------|----|---------|
| Basic | 6f44f470-4375-11f0-8589-5783136f7db4 | Yes |
| Standared | 7aea5ea0-4375-11f0-8589-5783136f7db4 | No |
| Premium | 8378c4d0-4375-11f0-8589-5783136f7db4 | No |
| Default | eaa4aa80-0f16-11ec-9615-b944fb15011f | No |

### Existing Mappings
| Zoho Keyword | Thingsboard Profile Name |
|--------------|--------------------------|
| Basic | Basic |
| Standard | Standared |
| Enterprise | Premium |
| test | Default |

## Proposed Mapping Strategy

The mapping logic uses a keyword search on the Zoho Plan Name/Code to find a matching Thingsboard Profile.

All available plans have been mapped.

## Implementation

A script `manage_mappings.py` will be created to allow adding, listing, and deleting mappings.

### Usage
```bash
# List mappings
python manage_mappings.py list

# Add mapping
python manage_mappings.py add "Enterprise" "Premium"
python manage_mappings.py add "test" "Default"

# Delete mapping
python manage_mappings.py delete "Enterprise"
```

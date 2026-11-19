#!/usr/bin/env python3
"""Generate the checked-in JSON-compatible OpenAPI YAML from controller/record signatures.
No Java dependencies; review descriptions after changing API behavior.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JAVA = ROOT / 'src/main/java/io/github/hienpham0344/stayfinder'
SCHEMAS = {}
RECORDS = {}

def balanced(text, start, opening='(', closing=')'):
    depth = 0
    quoted = False
    escaped = False
    for pos in range(start, len(text)):
        char = text[pos]
        if char == '"' and not escaped: quoted = not quoted
        if not quoted:
            if char == opening: depth += 1
            if char == closing:
                depth -= 1
                if depth == 0: return pos
        escaped = char == '\\' and not escaped
    raise ValueError('Unbalanced signature')

def strip_annotations(text):
    while match := re.search(r'@[\w.]+', text):
        end = match.end()
        if end < len(text) and text[end] == '(': end = balanced(text, end) + 1
        text = text[:match.start()] + text[end:]
    return text.strip()

def split(text):
    parts, start, depth, paren = [], 0, 0, 0
    for pos, char in enumerate(text):
        if char == '<': depth += 1
        if char == '>': depth -= 1
        if char == '(': paren += 1
        if char == ')': paren -= 1
        if char == ',' and depth == 0 and paren == 0:
            parts.append(text[start:pos].strip()); start = pos + 1
    if text[start:].strip(): parts.append(text[start:].strip())
    return parts

for path in JAVA.rglob('*.java'):
    text = path.read_text()
    for record in re.finditer(r'public\s+record\s+(\w+)\s*\(', text):
        start = text.index('(', record.start())
        fields = text[start + 1:balanced(text, start)]
        name = record.group(1)
        qualified = name if name == path.stem else path.stem + '.' + name
        RECORDS[qualified] = fields

ENUMS = {'UserRole': ['CUSTOMER','PARTNER','ADMIN'], 'AccommodationStatus': ['PENDING','ACTIVE','INACTIVE'],
         'BookingStatus': ['PENDING','CONFIRMED','CANCELLED','COMPLETED'], 'PaymentStatus': ['PENDING','SUCCESS','FAILED','REFUNDED'],
         'RoomStatus': ['AVAILABLE','MAINTENANCE','UNAVAILABLE'], 'PartnerApplication.Status': ['PENDING','APPROVED','REJECTED']}

def schema(kind):
    kind = re.sub(r'\s+', '', kind)
    kind = re.sub(r'(?:org|io|java)\.(?:[a-z][a-z0-9_]*\.)+', '', kind)
    if kind.startswith('ResponseEntity<'): return schema(kind[15:-1])
    if kind.startswith('ApiResponse<'):
        return {'type':'object','required':['code','message','result'],'properties':{
            'code':{'type':'string','enum':['SUCCESS']},'message':{'type':'string'},'result':schema(kind[12:-1])}}
    if kind.startswith(('List<','Collection<','Set<')):
        return {'type':'array','items':schema(kind[kind.index('<')+1:-1])}
    if kind.startswith('Page<'):
        return {'type':'object','required':['content','number','totalPages'],'properties':{
            'content':{'type':'array','items':schema(kind[5:-1])},'number':{'type':'integer'},
            'totalPages':{'type':'integer'},'totalElements':{'type':'integer','format':'int64'}}}
    if kind.startswith('Map<'): return {'type':'object','additionalProperties':True}
    if kind in ENUMS: return {'type':'string','enum':ENUMS[kind]}
    basic = {'String':{'type':'string'},'UUID':{'type':'string','format':'uuid'},'LocalDate':{'type':'string','format':'date'},
             'Instant':{'type':'string','format':'date-time'},'BigDecimal':{'type':'number','description':'Whole VND for monetary fields'},
             'int':{'type':'integer','format':'int32'},'Integer':{'type':'integer','format':'int32'},
             'long':{'type':'integer','format':'int64'},'Long':{'type':'integer','format':'int64'},
             'boolean':{'type':'boolean'},'Boolean':{'type':'boolean'},'Void':{'nullable':True},'byte[]':{'type':'object'}}
    if kind in basic: return dict(basic[kind])
    if kind not in RECORDS:
        found = [name for name in RECORDS if name.rsplit('.',1)[-1] == kind]
        if len(found) == 1: kind = found[0]
    if kind in RECORDS:
        key = kind.replace('.','')
        if key not in SCHEMAS:
            SCHEMAS[key] = {'type':'object'}
            properties, required = {}, []
            for field in split(RECORDS[kind]):
                clean = strip_annotations(field)
                match = re.match(r'(.+)\s+(\w+)$', clean)
                if not match: raise ValueError(field)
                field_type, name = match.groups()
                properties[name] = schema(field_type)
                if any(tag in field for tag in ['@NotNull','@NotBlank']) or field_type in ['int','long','boolean']:
                    required.append(name)
                size = re.search(r'@Size\(max\s*=\s*(\d+)\)',field)
                if size: properties[name]['maxItems' if field_type.startswith('List') else 'maxLength'] = int(size.group(1))
                if minimum := re.search(r'@Min\((\d+)\)',field): properties[name]['minimum']=int(minimum.group(1))
                if maximum := re.search(r'@Max\((\d+)\)',field): properties[name]['maximum']=int(maximum.group(1))
            SCHEMAS[key] = {'type':'object','properties':properties}
            if required: SCHEMAS[key]['required']=required
        return {'$ref':'#/components/schemas/'+key}
    raise ValueError('Unknown DTO type: '+kind)

paths = {}
for path in JAVA.rglob('*Controller.java'):
    text = path.read_text()
    class_pos = text.index('public class ')
    base = re.search(r'@RequestMapping\("([^"]+)"\)',text[:class_pos])
    prefix = base.group(1) if base else ''
    for mapping in re.finditer(r'@(Get|Post|Put|Patch|Delete)Mapping(?:\("([^"]*)"\))?',text[class_pos:]):
        end = class_pos + mapping.end()
        method = re.search(r'public\s+(.+?)\s+(\w+)\s*\(',text[end:],re.S)
        if not method: raise ValueError(path)
        start = end+method.end()-1
        arguments = text[start+1:balanced(text,start)]
        route = prefix+(mapping.group(2) or '')
        http = mapping.group(1).lower()
        response = schema(method.group(1).strip())
        public = route in ['/api/auth/login','/api/auth/register','/api/payments/webhook/sepay','/api/recommendations'] or (http=='get' and route.startswith('/api/accommodations'))
        operation = {'operationId':path.stem+'_'+method.group(2),'tags':[path.stem.replace('Controller','')],
                     'security':[] if public else [{'BearerAuth':[]}], 'responses':{
                     '200':{'description':'Success','content':{'application/json':{'schema':response}}}}}
        params=[]
        for argument in split(arguments):
            clean=strip_annotations(argument)
            field=re.match(r'(.+)\s+(\w+)$',clean)
            if not field: raise ValueError(argument)
            kind,name=field.groups()
            if '@PathVariable' in argument or '@RequestParam' in argument or '@RequestHeader' in argument:
                location='path' if '@PathVariable' in argument else 'header' if '@RequestHeader' in argument else 'query'
                ann=re.search(r'@(PathVariable|RequestParam|RequestHeader)\("([^"]+)"\)',argument)
                wire=ann.group(2) if ann else name
                required=location=='path' or (location=='header' and 'required = false' not in argument) or (location=='query' and 'defaultValue' not in argument and not re.search(r'required\s*=\s*false',argument))
                params.append({'name':wire,'in':location,'required':required,'schema':schema(kind)})
            elif '@RequestBody' in argument:
                operation['requestBody']={'required':not bool(re.search(r'required\s*=\s*false',argument)),
                    'content':{'application/json':{'schema':schema(kind)}}}
        if params: operation['parameters']=params
        if route.startswith('/api/admin'): operation['description']='Requires ADMIN. Monetary totals use VND. Versioned writes reject stale versions with 409.'
        elif route.startswith('/api/partner/'): operation['description']='Requires PARTNER; queries and writes are limited to owned properties.'
        if route=='/api/partner-applications' and http=='post': operation['description']='Requires CUSTOMER; pending retries return the current application.'
        if route=='/api/auth/logout': operation['description']='Revokes every token for the current account by incrementing auth_version.'
        if route=='/api/auth/register': operation['responses']['201']=operation['responses'].pop('200')
        if route=='/api/payments/webhook/sepay':
            operation['description']='SePay sandbox. HMAC-SHA256 of timestamp + period + exact raw body, signature prefixed sha256=. Timestamp window +/-300 seconds. Replays are idempotent; signed rejected transfers are retained for reconciliation.'
            operation['requestBody']['content']['application/json']['schema']={'type':'object','required':['id','transferAmount','code','accountNumber','transferType'],'properties':{
                'id':{'type':'integer','format':'int64','minimum':1},'transferAmount':{'type':'integer','format':'int64','minimum':1},
                'code':{'type':'string','description':'Payment code returned by payment creation'},'accountNumber':{'type':'string'},'transferType':{'type':'string','enum':['in']}}}
            operation['responses']['200']['content']['application/json']['schema']={'type':'object','required':['success'],'properties':{'success':{'type':'boolean','enum':[True]}}}
        for code,description in [('400','Invalid request'),('401','Authentication required or invalid webhook signature'),('403','Forbidden'),('404','Resource not found or outside ownership scope'),('409','State, uniqueness or optimistic-version conflict'),('429','Authentication rate limit exceeded')]:
            operation['responses'][code]={'description':description,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/ErrorResponse'}}}}
        paths.setdefault(route,{})[http]=operation
SCHEMAS['ErrorResponse']={'type':'object','required':['code','message','status'],'properties':{'code':{'type':'string'},'message':{'type':'string'},'status':{'type':'integer'}}}
output={'openapi':'3.0.3','info':{'title':'StayFinder backend','version':'0.1.0','description':'CUSTOMER/PARTNER/ADMIN MVP. Single physical room per booking, VND, SePay sandbox. Legacy list routes remain compatible; prefer paginated routes.'},
        'servers':[{'url':'http://localhost:8080'}],'paths':dict(sorted(paths.items())),
        'components':{'securitySchemes':{'BearerAuth':{'type':'http','scheme':'bearer','bearerFormat':'JWT'}},'schemas':dict(sorted(SCHEMAS.items()))}}
ROOT.joinpath('docs/openapi.yaml').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(f'OpenAPI: {len(paths)} paths, {sum(len(v) for v in paths.values())} operations, {len(SCHEMAS)} schemas')

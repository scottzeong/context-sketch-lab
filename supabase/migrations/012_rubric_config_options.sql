alter table public.config_options
drop constraint if exists config_options_category_check;

alter table public.config_options
add constraint config_options_category_check
check (
  category in (
    'age_range',
    'difficulty_level',
    'target_length',
    'text_structure',
    'rubric_axis'
  )
);

insert into public.config_options (
  organization_id,
  category,
  label,
  value,
  sort_order,
  created_by
)
select
  organizations.id,
  seed.category,
  seed.label,
  seed.value,
  seed.sort_order,
  null
from public.organizations
cross join (
  values
    ('rubric_axis', '상황 추론', 'situation_inference', 1),
    ('rubric_axis', '구조 이해', 'structure', 2),
    ('rubric_axis', '추상화', 'abstraction', 3),
    ('rubric_axis', '관점 전환', 'perspective_shift', 4),
    ('rubric_axis', '표현 통합', 'expression_integration', 5)
) as seed(category, label, value, sort_order)
on conflict (organization_id, category, value) do nothing;

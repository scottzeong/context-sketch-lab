alter table public.config_options
add column if not exists prompt_text text;

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
    'rubric_axis',
    'rubric_weight'
  )
);

update public.config_options
set label = case value
  when 'situation_inference' then '상황 추론'
  when 'structure' then '구조 이해'
  when 'abstraction' then '추상화'
  when 'perspective_shift' then '관점 전환'
  when 'expression_integration' then '표현 통합'
  else label
end
where category = 'rubric_axis';

update public.config_options
set prompt_text = case value
  when 'narrative' then '인물, 사건, 갈등, 변화가 흐르는 이야기 구조로 구성한다.'
  when 'cause_effect' then '상황의 원인, 중간 사건, 결과가 명확하게 이어지도록 구성한다.'
  when 'problem_solution' then '문제 상황, 시도, 해결 또는 미해결 지점을 중심으로 구성한다.'
  when 'compare_contrast' then '두 대상의 공통점과 차이점을 비교해 맥락을 드러낸다.'
  when 'claim_evidence' then '주장과 근거의 연결이 분명하도록 구성한다.'
  else prompt_text
end
where category = 'text_structure'
  and prompt_text is null;

update public.config_options
set prompt_text = case value
  when 'situation_inference' then '학생이 단서에서 상황, 원인, 감정을 추론했는지 평가한다.'
  when 'structure' then '학생이 사건, 관계, 흐름을 구조적으로 연결했는지 평가한다.'
  when 'abstraction' then '구체적 장면을 상위 개념이나 원리로 정리했는지 평가한다.'
  when 'perspective_shift' then '다른 인물이나 관점에서 상황을 다시 볼 수 있는지 평가한다.'
  when 'expression_integration' then '그림, 기호, 설명을 하나의 구조로 통합했는지 평가한다.'
  else prompt_text
end
where category = 'rubric_axis'
  and prompt_text is null;

insert into public.config_options (
  organization_id,
  category,
  label,
  value,
  sort_order,
  prompt_text,
  created_by
)
select
  organizations.id,
  'rubric_weight',
  'L3 기본 가중치',
  'L3',
  1,
  '{}',
  null
from public.organizations
on conflict (organization_id, category, value) do nothing;

// 示例文档：各预览页面共用（挂在 window 上，<script> 页面也能直接使用）
window.SAMPLE_DATA = {
  header: [{ value: '第一人民医院', size: 18, bold: true, rowFlex: 'center' }],
  main: [
    { value: '门诊病历', size: 26, bold: true, rowFlex: 'center' },
    { value: '\n' },
    { value: '姓名：' },
    {
      type: 'control',
      value: '',
      control: {
        type: 'text',
        value: null,
        placeholder: '请输入姓名',
        conceptId: 'patient.name'
      }
    },
    { value: '    性别：' },
    {
      type: 'control',
      value: '',
      control: {
        type: 'select',
        value: null,
        code: null,
        placeholder: '请选择',
        conceptId: 'patient.gender',
        valueSets: [
          { value: '男', code: '男' },
          { value: '女', code: '女' }
        ]
      }
    },
    { value: '    就诊日期：' },
    {
      type: 'control',
      value: '',
      control: {
        type: 'date',
        value: null,
        placeholder: '请选择日期',
        dateFormat: 'yyyy-MM-dd',
        conceptId: 'visit.date'
      }
    },
    { value: '\n' },
    { value: '主诉：', bold: true },
    { value: '\n发热三天，咳嗽五天。' },
    { value: '\n' },
    { value: '过敏史：', bold: true },
    {
      type: 'control',
      value: '',
      control: {
        type: 'checkbox',
        value: null,
        code: null,
        conceptId: 'allergy',
        valueSets: [
          { value: '无', code: '无' },
          { value: '青霉素', code: '青霉素' },
          { value: '头孢', code: '头孢' }
        ]
      }
    },
    { value: '\n' },
    { value: '检查结果：', bold: true },
    { value: '\n' },
    {
      type: 'table',
      value: '',
      colgroup: [{ width: 184 }, { width: 185 }, { width: 185 }],
      trList: [
        {
          height: 40,
          tdList: [
            { colspan: 1, rowspan: 1, value: [{ value: '项目', bold: true }] },
            { colspan: 1, rowspan: 1, value: [{ value: '结果', bold: true }] },
            { colspan: 1, rowspan: 1, value: [{ value: '参考值', bold: true }] }
          ]
        },
        {
          height: 40,
          tdList: [
            { colspan: 1, rowspan: 1, value: [{ value: '体温' }] },
            { colspan: 1, rowspan: 1, value: [{ value: '38.5℃', color: '#e63946' }] },
            { colspan: 1, rowspan: 1, value: [{ value: '36.0～37.2℃' }] }
          ]
        }
      ]
    },
    { value: '\n' },
    { value: '处理意见：', bold: true },
    { value: '\n' },
    {
      type: 'control',
      value: '',
      control: {
        type: 'text',
        value: null,
        placeholder: '请输入处理意见',
        conceptId: 'advice'
      }
    }
  ],
  footer: [{ value: 'canvas-editor-ui', size: 12, rowFlex: 'right' }]
}

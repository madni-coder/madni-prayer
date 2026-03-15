const axios = require('axios');
async function test() {
   try {
     const schemaRes = await axios.get('http://localhost:3000/api/admin/events/test-slug');
     const schema = schemaRes.data.event;
     const updatePayload = {
         page_title: schema.title,
         description: schema.description,
         color: schema.theme_color,
         submit_label: schema.submit_label,
         fields: schema.schema_fields,
         isActive: !schema.is_active
     }
     const putRes = await axios.put(`http://localhost:3000/api/admin/events/test-slug`, { schema: updatePayload });
     console.log('Success:', putRes.data.event.isActive);
   } catch (err) { console.error('Error:', err.response?.data || err.message); }
}
test();

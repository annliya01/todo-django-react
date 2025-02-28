from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    title = serializers.CharField()
    description = serializers.CharField()
    priority=serializers.ChoiceField(choices=["High","Medium","Low"])
    status = serializers.ChoiceField(choices=["Pending", "Completed"])
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'priority', 'status', 'created_at', 'updated_at']
